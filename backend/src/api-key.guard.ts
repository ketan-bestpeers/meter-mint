import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    // Query organization by apiKey and include its Plan
    const tenant = await this.prisma.organization.findUnique({
      where: { apiKey: String(apiKey) },
      include: { plan: true },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach the verified tenant to the request context.
    // Downstream handlers should always use req.tenant and NEVER trust tenant ID in request body.
    request.tenant = tenant;

    return true;
  }
}
