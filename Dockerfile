FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies with Bun
RUN npm install -g bun && bun install

# Copy source files
COPY . .

# Build the frontend
RUN bun run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.mjs"]
