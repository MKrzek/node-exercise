FROM node:24-alpine

WORKDIR /app

# Install ALL dependencies (including devDependencies for tsx)
COPY package*.json ./
RUN npm install --include=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "run", "dev"]
