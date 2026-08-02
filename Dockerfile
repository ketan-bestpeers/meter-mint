FROM node:20-alpine

# Install postgresql and redis
RUN apk add --no-cache postgresql postgresql-contrib redis

WORKDIR /app

# Copy package configuration files from backend
COPY backend/package*.json ./

# Install dependencies (including devDependencies for ts-node/prisma seed)
RUN npm install

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy remaining backend source files
COPY backend/ .

# Build NestJS application
RUN npm run build

# Make startup script executable
RUN chmod +x docker-entrypoint.sh

# Expose NestJS default port
EXPOSE 4000

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
