import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { randomBytes } from 'crypto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('plans')
  async getPlans() {
    return this.prisma.plan.findMany({
      orderBy: {
        basePrice: 'asc',
      },
    });
  }

  @Post()
  async createOrganization(
    @Body() body: { name: string; planId: string },
  ) {
    const { name, planId } = body;
    if (!name || !planId) {
      throw new HttpException('name and planId are required', HttpStatus.BAD_REQUEST);
    }

    // Check if the plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    // Generate unique API key
    const apiKey = `sk_test_${randomBytes(8).toString('hex')}`;

    try {
      const organization = await this.prisma.organization.create({
        data: {
          name,
          apiKey,
          planId,
        },
        include: {
          plan: true,
        },
      });

      return {
        message: 'Organization created and plan subscribed successfully',
        organization: {
          id: organization.id,
          name: organization.name,
          apiKey: organization.apiKey,
          plan: organization.plan,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database insertion failed';
      throw new HttpException(
        `Failed to create organization: ${msg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
