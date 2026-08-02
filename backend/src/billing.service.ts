import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(tenant: any, periodStart: string, periodEnd: string) {
    if (!periodStart || !periodEnd) {
      throw new HttpException('periodStart and periodEnd are required', HttpStatus.BAD_REQUEST);
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new HttpException('Invalid date formats', HttpStatus.BAD_REQUEST);
    }

    // 1. Fetch tenant plan details
    const basePrice = tenant.plan.basePrice;
    const includedQuantity = tenant.plan.includedQuantity;
    const overagePrice = tenant.plan.overagePrice;

    // 2. Read aggregated usage for the given period
    const aggregates = await this.prisma.aggregate.findMany({
      where: {
        organizationId: tenant.id,
        periodStart: {
          gte: start,
        },
        periodEnd: {
          lte: end,
        },
      },
    });

    const totalUsage = aggregates.reduce((sum, agg) => sum + agg.totalQuantity, 0);

    // 3. Calculate invoice details
    const overageUnits = Math.max(0, totalUsage - includedQuantity);
    const overageAmount = overageUnits * overagePrice;
    const totalAmount = basePrice + overageAmount;

    // 4. Upsert into Invoice table
    const invoice = await this.prisma.invoice.upsert({
      where: {
        organizationId_periodStart_periodEnd: {
          organizationId: tenant.id,
          periodStart: start,
          periodEnd: end,
        },
      },
      update: {
        basePrice,
        overageUnits,
        overageAmount,
        totalAmount,
      },
      create: {
        organizationId: tenant.id,
        periodStart: start,
        periodEnd: end,
        basePrice,
        overageUnits,
        overageAmount,
        totalAmount,
      },
    });

    return invoice;
  }

  async getInvoices(tenant: any) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId: tenant.id,
      },
      orderBy: {
        periodStart: 'desc',
      },
    });
  }
}
