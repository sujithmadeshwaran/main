FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Environment variables for Next.js build
ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["npm", "run", "start"]
