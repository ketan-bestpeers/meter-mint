import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyGuard } from './api-key.guard';
import { Tenant } from './tenant.decorator';
import { Organization, Plan } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Get('test-auth')
  @UseGuards(ApiKeyGuard)
  testAuth(@Tenant() tenant: Organization & { plan: Plan }) {
    return {
      message: 'Authentication successful',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        apiKey: tenant.apiKey,
        plan: tenant.plan,
      },
    };
  }
}
