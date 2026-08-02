import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { Tenant } from './tenant.decorator';
import { QuotaService } from './quota.service';

@Controller('v1/quota')
@UseGuards(ApiKeyGuard)
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('check')
  async check(
    @Tenant() tenant: any,
    @Query('meter') meter: string,
    @Query('quantity', new DefaultValuePipe(1), ParseIntPipe) quantity: number,
  ) {
    if (!meter) {
      throw new HttpException('Meter query parameter is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.quotaService.checkQuota(tenant, meter, quantity);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
    };
  }
}
