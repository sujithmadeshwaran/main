FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system utilities for PDF and building tools
RUN apk add --no-cache openssl

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including production and dev for TypeScript compiling)
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/server.js"]
