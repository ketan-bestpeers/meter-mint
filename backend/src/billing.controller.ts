import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { Tenant } from './tenant.decorator';
import { BillingService } from './billing.service';

@Controller('v1/invoices')
@UseGuards(ApiKeyGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('generate')
  async generate(
    @Tenant() tenant: any,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.billingService.generateInvoice(tenant, periodStart, periodEnd);
  }

  @Get()
  async list(@Tenant() tenant: any) {
    return this.billingService.getInvoices(tenant);
  }
}
