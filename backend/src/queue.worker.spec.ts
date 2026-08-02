import { Test, TestingModule } from '@nestjs/testing';
import { QueueWorker, getBillingPeriod } from './queue.worker';
import { PrismaService } from './prisma.service';
import { Job } from 'bullmq';

describe('QueueWorker', () => {
  let worker: QueueWorker;
  let prismaService: PrismaService;

  const mockPrismaService = {
    meter: {
      findUnique: jest.fn(),
    },
    usageEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    aggregate: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueWorker,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    worker = module.get<QueueWorker>(QueueWorker);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();

    // Mock transaction behavior to execute callback directly
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
  });

  describe('getBillingPeriod', () => {
    it('should return correct monthly boundaries', () => {
      const result = getBillingPeriod(new Date('2026-08-15T12:00:00.000Z'));
      expect(result.periodStart.toISOString()).toBe('2026-08-01T00:00:00.000Z');
      expect(result.periodEnd.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    });
  });

  describe('processJob', () => {
    const validJob = {
      id: 'job_1',
      data: {
        organizationId: 'org_123',
        eventId: 'evt_123',
        meter: 'api_calls',
        quantity: 10,
        timestamp: '2026-08-15T12:00:00.000Z',
      },
    } as unknown as Job;

    it('should skip poison events with missing fields', async () => {
      const invalidJob = {
        id: 'job_2',
        data: {
          organizationId: 'org_123',
        },
      } as unknown as Job;

      await worker.processJob(invalidJob);
      expect(mockPrismaService.meter.findUnique).not.toHaveBeenCalled();
    });

    it('should skip poison events if meter does not exist', async () => {
      mockPrismaService.meter.findUnique.mockResolvedValue(null);

      await worker.processJob(validJob);
      expect(mockPrismaService.meter.findUnique).toHaveBeenCalledWith({ where: { name: 'api_calls' } });
      expect(mockPrismaService.usageEvent.findUnique).not.toHaveBeenCalled();
    });

    it('should skip duplicate events (idempotency)', async () => {
      mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
      mockPrismaService.usageEvent.findUnique.mockResolvedValue({ id: 'existing_123' });

      await worker.processJob(validJob);
      expect(mockPrismaService.usageEvent.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.usageEvent.create).not.toHaveBeenCalled();
    });

    it('should process new events successfully under a transaction', async () => {
      mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
      mockPrismaService.usageEvent.findUnique.mockResolvedValue(null);

      await worker.processJob(validJob);

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          eventId: 'evt_123',
          organizationId: 'org_123',
          meterName: 'api_calls',
          quantity: 10,
          timestamp: new Date('2026-08-15T12:00:00.000Z'),
        },
      });

      expect(mockPrismaService.aggregate.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_meterId_periodStart_periodEnd: {
            organizationId: 'org_123',
            meterId: 'meter_123',
            periodStart: new Date('2026-08-01T00:00:00.000Z'),
            periodEnd: new Date('2026-09-01T00:00:00.000Z'),
          },
        },
        update: {
          totalQuantity: {
            increment: 10,
          },
        },
        create: {
          organizationId: 'org_123',
          meterId: 'meter_123',
          periodStart: new Date('2026-08-01T00:00:00.000Z'),
          periodEnd: new Date('2026-09-01T00:00:00.000Z'),
          totalQuantity: 10,
        },
      });
    });

    it('should complete gracefully on foreign key constraint fail (poison event)', async () => {
      mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
      mockPrismaService.usageEvent.findUnique.mockResolvedValue(null);
      
      const error = new Error('Foreign key error');
      (error as any).code = 'P2003';
      mockPrismaService.usageEvent.create.mockRejectedValue(error);

      await expect(worker.processJob(validJob)).resolves.not.toThrow();
    });

    it('should re-throw other database errors for retry', async () => {
      mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
      mockPrismaService.usageEvent.findUnique.mockResolvedValue(null);
      
      const error = new Error('Connection timeout');
      mockPrismaService.usageEvent.create.mockRejectedValue(error);

      await expect(worker.processJob(validJob)).rejects.toThrow('Connection timeout');
    });
  });
});
