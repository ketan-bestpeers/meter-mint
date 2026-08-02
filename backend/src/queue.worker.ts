import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from './prisma.service';

export function getBillingPeriod(timestamp: Date): { periodStart: Date; periodEnd: Date } {
  const date = new Date(timestamp);
  const periodStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { periodStart, periodEnd };
}

@Injectable()
export class QueueWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = new Logger(QueueWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.worker = new Worker(
      'usage-ingestion',
      async (job: Job) => {
        await this.processJob(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });
  }

  async processJob(job: Job) {
    const { organizationId, eventId, meter, quantity, timestamp } = job.data || {};

    // 1. Basic validation of job data (poison check)
    if (!organizationId || !eventId || !meter || quantity === undefined || !timestamp) {
      this.logger.error(`Poison job ${job.id}: missing required fields in data: ${JSON.stringify(job.data)}`);
      return; // complete gracefully
    }

    // 2. Check if meter exists (poison check)
    const meterRecord = await this.prisma.meter.findUnique({
      where: { name: meter },
    });
    if (!meterRecord) {
      this.logger.error(`Poison job ${job.id}: meter "${meter}" does not exist in database`);
      return; // complete gracefully
    }

    // 3. Idempotency check
    const existingEvent = await this.prisma.usageEvent.findUnique({
      where: {
        organizationId_eventId: {
          organizationId,
          eventId,
        },
      },
    });
    if (existingEvent) {
      this.logger.log(`Idempotency: Event ${eventId} for organization ${organizationId} already exists. Skipping.`);
      return; // complete gracefully
    }

    // 4. Calculate billing period
    const { periodStart, periodEnd } = getBillingPeriod(new Date(timestamp));

    // 5. Database transaction with retryable error handling
    try {
      await this.prisma.$transaction(async (tx) => {
        // Insert record into UsageEvent
        await tx.usageEvent.create({
          data: {
            eventId,
            organizationId,
            meterName: meter,
            quantity,
            timestamp: new Date(timestamp),
          },
        });

        // Upsert running total in Aggregate
        await tx.aggregate.upsert({
          where: {
            organizationId_meterId_periodStart_periodEnd: {
              organizationId,
              meterId: meterRecord.id,
              periodStart,
              periodEnd,
            },
          },
          update: {
            totalQuantity: {
              increment: quantity,
            },
          },
          create: {
            organizationId,
            meterId: meterRecord.id,
            periodStart,
            periodEnd,
            totalQuantity: quantity,
          },
        });
      });
      this.logger.log(`Successfully processed event ${eventId} for organization ${organizationId}`);
    } catch (error: any) {
      // Prisma error codes:
      // P2003: Foreign key constraint failed (e.g. organizationId does not exist). This is a poison event.
      // P2002: Unique constraint failed (e.g. race condition on UsageEvent insert).
      if (error.code === 'P2003') {
        this.logger.error(`Poison job ${job.id}: Foreign key constraint failed. Organization ${organizationId} may not exist.`);
        return; // complete gracefully
      }
      if (error.code === 'P2002') {
        this.logger.warn(`Unique constraint violation (race condition) for event ${eventId}. Skipping.`);
        return; // complete gracefully
      }

      // Re-throw other errors (e.g., db connection/timeout) so BullMQ retries
      this.logger.error(`Transient error processing job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
