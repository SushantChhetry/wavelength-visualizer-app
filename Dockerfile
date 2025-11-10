# Multi-stage build for Wavelength Visualizer App

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install vite globally for preview server (lightweight approach)
RUN npm install -g vite && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (default 3000, can be overridden via PORT env var)
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000

# Start the preview server
# Using vite preview directly with host option (port is read from vite.config.ts or PORT env var)
CMD ["sh", "-c", "vite preview --host 0.0.0.0 --port ${PORT:-3000}"]

