import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { Tenant } from './tenant.decorator';
import { CreateEventDto } from './create-event.dto';
import { QueueService } from './queue.service';
import { QuotaService } from './quota.service';

@Controller('v1/events')
@UseGuards(ApiKeyGuard)
export class EventsController {
  constructor(
    private readonly queueService: QueueService,
    private readonly quotaService: QuotaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestEvent(
    @Body() body: CreateEventDto,
    @Tenant() tenant: any,
    @Query('strict') strict?: string,
  ) {
    if (strict === 'true') {
      await this.quotaService.checkQuota(tenant, body.meter, body.quantity);
    }

    await this.queueService.usageQueue.add('ingest-event', {
      eventId: body.eventId,
      meter: body.meter,
      quantity: body.quantity,
      timestamp: body.timestamp,
      organizationId: tenant.id,
    });

    return {
      status: 'queued',
      eventId: body.eventId,
    };
  }
}
