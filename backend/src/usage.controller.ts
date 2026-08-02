import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { Tenant } from './tenant.decorator';
import { PrismaService } from './prisma.service';
import { getBillingPeriod } from './queue.worker';

@Controller('v1/usage')
@UseGuards(ApiKeyGuard)
export class UsageController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('current')
  async getCurrentUsage(@Tenant() tenant: any) {
    const { periodStart, periodEnd } = getBillingPeriod(new Date());

    const aggregates = await this.prisma.aggregate.findMany({
      where: {
        organizationId: tenant.id,
        periodStart,
        periodEnd,
      },
    });

    const currentUsage = aggregates.reduce((sum, agg) => sum + agg.totalQuantity, 0);
    const limit = tenant.plan.includedQuantity;

    return {
      currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage),
      periodStart,
      periodEnd,
    };
  }
}
