FROM node:20-alpine

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies (including devDependencies for ts-node/prisma seed)
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining source files
COPY . .

# Build NestJS application
RUN npm run build

# Make startup script executable
RUN chmod +x docker-entrypoint.sh

# Expose NestJS default port
EXPOSE 4000

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
