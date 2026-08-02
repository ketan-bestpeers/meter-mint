#!/bin/sh
set -e

# Wait for database port to be open
echo "Waiting for postgres to be ready..."
while ! nc -z postgres 5432; do
  sleep 0.5
done
echo "Postgres is ready."

# Apply migrations / DB push
echo "Running Prisma migrations/db push..."
npx prisma db push --accept-data-loss

# Apply RLS policies
echo "Applying Row Level Security policies..."
node prisma/apply-rls.js

# Seed database
echo "Seeding database..."
npx prisma db seed

# Start NestJS backend
echo "Starting backend server..."
exec node dist/src/main.js
