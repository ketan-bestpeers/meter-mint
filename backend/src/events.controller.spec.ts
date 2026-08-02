import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { QueueService } from './queue.service';
import { CreateEventDto } from './create-event.dto';
import { Organization } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { QuotaService } from './quota.service';

describe('EventsController', () => {
  let controller: EventsController;
  let queueService: QueueService;
  let quotaService: QuotaService;

  const mockQueueService = {
    usageQueue: {
      add: jest.fn(),
    },
  };

  const mockPrismaService = {};

  const mockQuotaService = {
    checkQuota: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QuotaService,
          useValue: mockQuotaService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    queueService = module.get<QueueService>(QueueService);
    quotaService = module.get<QuotaService>(QuotaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should push event onto queue and return response', async () => {
    const dto: CreateEventDto = {
      eventId: 'evt_123',
      meter: 'api_calls',
      quantity: 5,
      timestamp: '2026-08-01T12:00:00Z',
    };

    const tenant = {
      id: 'org_123',
      name: 'Test Org',
      apiKey: 'sk_test_123',
      planId: 'plan_123',
      createdAt: new Date(),
    } as Organization;

    const result = await controller.ingestEvent(dto, tenant);

    expect(queueService.usageQueue.add).toHaveBeenCalledWith('ingest-event', {
      eventId: 'evt_123',
      meter: 'api_calls',
      quantity: 5,
      timestamp: '2026-08-01T12:00:00Z',
      organizationId: 'org_123',
    });

    expect(quotaService.checkQuota).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: 'queued',
      eventId: 'evt_123',
    });
  });

  it('should perform quota check and block if strict is true', async () => {
    const dto: CreateEventDto = {
      eventId: 'evt_123',
      meter: 'api_calls',
      quantity: 5,
      timestamp: '2026-08-01T12:00:00Z',
    };

    const tenant = {
      id: 'org_123',
      name: 'Test Org',
      apiKey: 'sk_test_123',
      planId: 'plan_123',
      createdAt: new Date(),
    } as Organization;

    mockQuotaService.checkQuota.mockRejectedValue(new Error('Quota exceeded'));

    await expect(controller.ingestEvent(dto, tenant, 'true')).rejects.toThrow('Quota exceeded');
    expect(quotaService.checkQuota).toHaveBeenCalledWith(tenant, 'api_calls', 5);
    expect(queueService.usageQueue.add).not.toHaveBeenCalled();
  });
});
