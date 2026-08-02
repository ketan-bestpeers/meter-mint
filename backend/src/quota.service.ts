import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getBillingPeriod } from './queue.worker';

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async checkQuota(
    tenant: any,
    meterName: string,
    requestedQuantity: number,
  ): Promise<{ allowed: boolean; currentUsage: number; limit: number; remaining: number }> {
    const meterRecord = await this.prisma.meter.findUnique({
      where: { name: meterName },
    });

    if (!meterRecord) {
      throw new HttpException('Meter not found', HttpStatus.NOT_FOUND);
    }

    const { periodStart, periodEnd } = getBillingPeriod(new Date());

    const aggregate = await this.prisma.aggregate.findUnique({
      where: {
        organizationId_meterId_periodStart_periodEnd: {
          organizationId: tenant.id,
          meterId: meterRecord.id,
          periodStart,
          periodEnd,
        },
      },
    });

    const currentUsage = aggregate ? aggregate.totalQuantity : 0;
    const limit = tenant.plan.includedQuantity;
    const remaining = limit - currentUsage;

    if (currentUsage + requestedQuantity > limit && !tenant.plan.allowOverage) {
      throw new HttpException(
        { allowed: false, currentUsage, limit },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return {
      allowed: true,
      currentUsage,
      limit,
      remaining,
    };
  }
}
