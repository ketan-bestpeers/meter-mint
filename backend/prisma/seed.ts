import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Meter: "api_calls"
  const apiCallsMeter = await prisma.meter.upsert({
    where: { name: 'api_calls' },
    update: {},
    create: { name: 'api_calls' },
  });
  console.log('Seeded Meter:', apiCallsMeter);

  // 2. Seed Plans: "Free" and "Pro"
  const freePlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Free',
      includedQuantity: 100,
      allowOverage: false,
      overagePrice: 0.0,
      basePrice: 0.0,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Free',
      includedQuantity: 100,
      allowOverage: false,
      overagePrice: 0.0,
      basePrice: 0.0,
    },
  });
  console.log('Seeded Plan:', freePlan);

  const proPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      name: 'Pro',
      includedQuantity: 1000,
      allowOverage: true,
      overagePrice: 0.02,
      basePrice: 20.0,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Pro',
      includedQuantity: 1000,
      allowOverage: true,
      overagePrice: 0.02,
      basePrice: 20.0,
    },
  });
  console.log('Seeded Plan:', proPlan);

  // 3. Seed Organizations
  const freeOrg = await prisma.organization.upsert({
    where: { apiKey: 'sk_test_free_123' },
    update: {
      name: 'Free Tenant',
      planId: freePlan.id,
    },
    create: {
      name: 'Free Tenant',
      apiKey: 'sk_test_free_123',
      planId: freePlan.id,
    },
  });
  console.log('Seeded Organization:', freeOrg);

  const proOrg = await prisma.organization.upsert({
    where: { apiKey: 'sk_test_pro_456' },
    update: {
      name: 'Pro Tenant',
      planId: proPlan.id,
    },
    create: {
      name: 'Pro Tenant',
      apiKey: 'sk_test_pro_456',
      planId: proPlan.id,
    },
  });
  console.log('Seeded Organization:', proOrg);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
