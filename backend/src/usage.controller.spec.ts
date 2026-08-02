import { Test, TestingModule } from '@nestjs/testing';
import { UsageController } from './usage.controller';
import { PrismaService } from './prisma.service';

describe('UsageController', () => {
  let controller: UsageController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    aggregate: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<UsageController>(UsageController);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should calculate current usage and remaining limits correctly', async () => {
    mockPrismaService.aggregate.findMany.mockResolvedValue([
      { totalQuantity: 30 },
      { totalQuantity: 40 },
    ]);

    const tenant = {
      id: 'org_123',
      plan: {
        includedQuantity: 100,
      },
    };

    const result = await controller.getCurrentUsage(tenant);

    expect(result).toEqual(expect.objectContaining({
      currentUsage: 70,
      limit: 100,
      remaining: 30,
    }));
    expect(result.periodStart).toBeInstanceOf(Date);
    expect(result.periodEnd).toBeInstanceOf(Date);
  });
});
