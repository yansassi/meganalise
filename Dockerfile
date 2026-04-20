FROM node:22-alpine

WORKDIR /app

# Copy package.json only to avoid lockfile platform issues
COPY package.json ./

# Install build dependencies and tools
RUN apk add --no-cache python3 make g++ git

# Install dependencies
RUN npm cache clean --force && npm install --omit=dev

# Copy server source code
COPY server ./server

# Copy other potential root files needed (like specific configs if any, but seemingly verified ok)
# If .env is used, it should be provided by Coolify at runtime, but we copy the structure.

# Expose the port (Coolify usually maps 80, but app might listen on 3000 or 8080)
# Looking at logs/code, usually 3000 or specified by env.
EXPOSE 3000

# Start command
CMD ["node", "server/index.js"]
