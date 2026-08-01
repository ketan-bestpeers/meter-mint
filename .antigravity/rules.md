# MeterMint Agent Rules & Guidelines

## 1. Technical Stack & Standards
- Backend: NestJS / Express with TypeScript (Strict mode enabled, no `any` types).
- Frontend: Next.js (App Router), Tailwind CSS, Framer Motion.
- Database & ORM: PostgreSQL with Prisma ORM.
- Async Queue: BullMQ with Redis.
- Testing: Jest & Supertest for backend integration tests.

## 2. Directory Structure & Monorepo Boundaries
- Keep all backend logic inside `/backend`.
- Keep all dashboard UI logic inside `/frontend`.
- Keep common configurations at the root level.
- Do not import code across frontend and backend directly.

## 3. Core Architectural & Security Rules
- Multi-Tenant Security: NEVER accept `organizationId` or `tenantId` from an API request body or URL path parameter. Always derive tenant context from the validated `x-api-key` header attached to `req.tenant`.
- Idempotency: All incoming usage events carry a client-supplied `eventId`. Operations on events must enforce uniqueness using `(organizationId, eventId)`.
- Fast Ingestion: The usage ingestion API must validate the payload, drop it into the BullMQ queue, and immediately return HTTP `202 Accepted`. Heavy aggregation logic must stay inside background workers.
- Deterministic Math: Invoicing math must be exact and reproducible for any closed billing period.

## 4. Execution Workflow
- Implement features incrementally—one module at a time.
- Update `backend/prisma/schema.prisma` first whenever a database model change is required.
- Include a specific verification step (`curl` command or test command) after completing every backend endpoint or worker feature.