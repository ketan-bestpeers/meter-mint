import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { QueueService } from './queue.service';
import { EventsController } from './events.controller';
import { QueueWorker } from './queue.worker';
import { QuotaService } from './quota.service';
import { QuotaController } from './quota.controller';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { UsageController } from './usage.controller';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [],
  controllers: [AppController, EventsController, QuotaController, BillingController, UsageController, OrganizationController],
  providers: [AppService, PrismaService, QueueService, QueueWorker, QuotaService, BillingService],
})
export class AppModule {}
