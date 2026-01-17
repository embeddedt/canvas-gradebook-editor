# Stage 1: Build the Vite app
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY ./src ./src
COPY vite.config.ts ./
COPY public ./public
COPY tsconfig*.json ./
COPY eslint.config.js ./
COPY index.html ./

# Build Vite app
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Install only production dependencies (optional, if server.js needs any)
RUN npm install --omit=dev

# Copy the built dist folder
COPY server.js ./
COPY --from=build /app/dist ./dist

# Expose port (adjust as needed)
EXPOSE 3000

# Run the server
ENTRYPOINT ["node", "server.js"]
