import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from './prisma.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const createMockContext = (headers: Record<string, string>) => {
    const request: any = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if x-api-key header is missing', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('API key is missing'),
    );
  });

  it('should throw UnauthorizedException if API key is invalid', async () => {
    const context = createMockContext({ 'x-api-key': 'sk_invalid' });
    mockPrismaService.organization.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid API key'),
    );
    expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
      where: { apiKey: 'sk_invalid' },
      include: { plan: true },
    });
  });

  it('should attach tenant to request context and return true if API key is valid', async () => {
    const context = createMockContext({ 'x-api-key': 'sk_valid' });
    const mockTenant = {
      id: 'tenant-id-123',
      name: 'Test Tenant',
      apiKey: 'sk_valid',
      planId: 'plan-id-123',
      plan: {
        id: 'plan-id-123',
        name: 'Pro',
      },
    };
    mockPrismaService.organization.findUnique.mockResolvedValue(mockTenant);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.tenant).toEqual(mockTenant);
  });
});
