import { Test, TestingModule } from '@nestjs/testing';
import { QuotaService } from './quota.service';
import { PrismaService } from './prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('QuotaService', () => {
  let service: QuotaService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    meter: {
      findUnique: jest.fn(),
    },
    aggregate: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QuotaService>(QuotaService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should throw NotFoundException if meter does not exist', async () => {
    mockPrismaService.meter.findUnique.mockResolvedValue(null);

    const tenant = { id: 'org_123' };
    await expect(service.checkQuota(tenant, 'invalid_meter', 1)).rejects.toThrow(
      new HttpException('Meter not found', HttpStatus.NOT_FOUND),
    );
  });

  it('should allow check if total usage is under limit', async () => {
    mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
    mockPrismaService.aggregate.findUnique.mockResolvedValue({ totalQuantity: 80 });

    const tenant = {
      id: 'org_123',
      plan: {
        includedQuantity: 100,
        allowOverage: false,
      },
    };

    const result = await service.checkQuota(tenant, 'api_calls', 10);
    expect(result).toEqual({
      allowed: true,
      currentUsage: 80,
      limit: 100,
      remaining: 20,
    });
  });

  it('should allow check if over limit but overage is allowed', async () => {
    mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
    mockPrismaService.aggregate.findUnique.mockResolvedValue({ totalQuantity: 95 });

    const tenant = {
      id: 'org_123',
      plan: {
        includedQuantity: 100,
        allowOverage: true,
      },
    };

    const result = await service.checkQuota(tenant, 'api_calls', 10);
    expect(result).toEqual({
      allowed: true,
      currentUsage: 95,
      limit: 100,
      remaining: 5,
    });
  });

  it('should throw TOO_MANY_REQUESTS if over limit and overage is disabled', async () => {
    mockPrismaService.meter.findUnique.mockResolvedValue({ id: 'meter_123', name: 'api_calls' });
    mockPrismaService.aggregate.findUnique.mockResolvedValue({ totalQuantity: 95 });

    const tenant = {
      id: 'org_123',
      plan: {
        includedQuantity: 100,
        allowOverage: false,
      },
    };

    await expect(service.checkQuota(tenant, 'api_calls', 10)).rejects.toThrow(
      new HttpException(
        { allowed: false, currentUsage: 95, limit: 100 },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });
});
