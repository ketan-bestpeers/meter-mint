#!/bin/sh
set -e

# Check if external PostgreSQL server is available
HAS_EXTERNAL_DB=0
if nc -z postgres 5432 2>/dev/null; then
  HAS_EXTERNAL_DB=1
  echo "Found external PostgreSQL database (postgres:5432)."
elif [ -n "$DATABASE_URL" ]; then
  # Extract host and port from DATABASE_URL
  DB_HOST_PORT=$(echo "$DATABASE_URL" | sed -e 's|^.*://||' -e 's|/.*$||' -e 's|^.*@||')
  DB_HOST=$(echo "$DB_HOST_PORT" | cut -d: -f1)
  DB_PORT=$(echo "$DB_HOST_PORT" | cut -d: -f2)
  if [ "$DB_PORT" = "$DB_HOST" ]; then
    DB_PORT=5432
  fi
  echo "Checking connection to database at $DB_HOST:$DB_PORT..."
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    HAS_EXTERNAL_DB=1
    echo "Found external database at $DB_HOST:$DB_PORT"
  fi
fi

if [ "$HAS_EXTERNAL_DB" -eq 1 ]; then
  echo "Using external database and Redis."
else
  echo "No external PostgreSQL service found. Starting local Redis and Postgres..."

  # 1. Start local Redis
  echo "Starting local Redis..."
  redis-server --daemonize yes || redis-server &

  # 2. Configure and start local Postgres
  echo "Configuring local Postgres..."
  mkdir -p /run/postgresql
  chown -R postgres:postgres /run/postgresql

  if [ ! -d "/var/lib/postgresql/data/base" ]; then
    echo "Initializing database storage..."
    mkdir -p /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql/data
    su - postgres -c "initdb -D /var/lib/postgresql/data"

    # Start postgres temporarily to configure it
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data -l /tmp/postgres_init.log start"
    
    # Wait for postgres to start
    until su - postgres -c "pg_isready" 2>/dev/null; do
      sleep 0.5
    done

    # Create postgres role and metermint_db database
    su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'password';\""
    su - postgres -c "psql -c \"CREATE DATABASE metermint_db OWNER postgres;\""
    
    # Stop postgres
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data -m fast stop"
  fi

  # Start postgres in background
  su - postgres -c "postgres -D /var/lib/postgresql/data" &

  # Wait for postgres to start
  until su - postgres -c "pg_isready" 2>/dev/null; do
    echo "Waiting for local Postgres to boot..."
    sleep 1
  done
  echo "Local Postgres is ready."

  # Override connection environment variables to use local services
  export DATABASE_URL="postgresql://postgres:password@localhost:5432/metermint_db?schema=public"
  export REDIS_HOST="localhost"
fi

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
