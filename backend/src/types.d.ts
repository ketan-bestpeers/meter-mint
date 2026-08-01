import { Organization, Plan } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: Organization & { plan: Plan };
    }
  }
}
