import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from './prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    aggregate: {
      findMany: jest.fn(),
    },
    invoice: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should throw error if periodStart or periodEnd are missing', async () => {
    const tenant = {};
    await expect(service.generateInvoice(tenant, '', '2026-09-01T00:00:00Z')).rejects.toThrow(
      new HttpException('periodStart and periodEnd are required', HttpStatus.BAD_REQUEST),
    );
  });

  it('should throw error if date formats are invalid', async () => {
    const tenant = {};
    await expect(service.generateInvoice(tenant, 'not-a-date', '2026-09-01T00:00:00Z')).rejects.toThrow(
      new HttpException('Invalid date formats', HttpStatus.BAD_REQUEST),
    );
  });

  it('should calculate correctly with 0 usage', async () => {
    mockPrismaService.aggregate.findMany.mockResolvedValue([]);
    mockPrismaService.invoice.upsert.mockImplementation(({ create }) => Promise.resolve({ id: 'inv_1', ...create }));

    const tenant = {
      id: 'org_123',
      plan: {
        basePrice: 20.00,
        includedQuantity: 100,
        overagePrice: 0.02,
      },
    };

    const result = await service.generateInvoice(tenant, '2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z');

    expect(result).toEqual(expect.objectContaining({
      organizationId: 'org_123',
      basePrice: 20.00,
      overageUnits: 0,
      overageAmount: 0.00,
      totalAmount: 20.00,
    }));
  });

  it('should calculate correctly with usage within limits', async () => {
    mockPrismaService.aggregate.findMany.mockResolvedValue([{ totalQuantity: 75 }]);
    mockPrismaService.invoice.upsert.mockImplementation(({ create }) => Promise.resolve({ id: 'inv_2', ...create }));

    const tenant = {
      id: 'org_123',
      plan: {
        basePrice: 20.00,
        includedQuantity: 100,
        overagePrice: 0.02,
      },
    };

    const result = await service.generateInvoice(tenant, '2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z');

    expect(result).toEqual(expect.objectContaining({
      organizationId: 'org_123',
      basePrice: 20.00,
      overageUnits: 0,
      overageAmount: 0.00,
      totalAmount: 20.00,
    }));
  });

  it('should calculate correctly with usage exceeding limits', async () => {
    mockPrismaService.aggregate.findMany.mockResolvedValue([
      { totalQuantity: 60 },
      { totalQuantity: 65 },
    ]); // totalUsage = 125
    mockPrismaService.invoice.upsert.mockImplementation(({ create }) => Promise.resolve({ id: 'inv_3', ...create }));

    const tenant = {
      id: 'org_123',
      plan: {
        basePrice: 20.00,
        includedQuantity: 100,
        overagePrice: 0.02,
      },
    };

    const result = await service.generateInvoice(tenant, '2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z');

    expect(result).toEqual(expect.objectContaining({
      organizationId: 'org_123',
      basePrice: 20.00,
      overageUnits: 25, // 125 - 100
      overageAmount: 0.50, // 25 * 0.02
      totalAmount: 20.50, // 20.00 + 0.50
    }));
  });

  describe('getInvoices', () => {
    const mockInvoices = [
      { id: 'inv_1', periodStart: new Date('2026-08-01') },
      { id: 'inv_2', periodStart: new Date('2026-07-01') },
    ];

    it('should list invoices for the tenant sorted by periodStart desc', async () => {
      mockPrismaService.invoice.findMany = jest.fn().mockResolvedValue(mockInvoices);
      const tenant = { id: 'org_123' };

      const result = await service.getInvoices(tenant);

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org_123' },
        orderBy: { periodStart: 'desc' },
      });
      expect(result).toEqual(mockInvoices);
    });
  });
});
