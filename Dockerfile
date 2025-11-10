# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port (Railway sets this via PORT env var)
EXPOSE 3000

# Start application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
