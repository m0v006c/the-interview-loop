FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production --no-fund --no-audit

# Verify express was installed (fails build if not found)
RUN node -e "require('./node_modules/express')" && echo "✓ express installed"

# Copy only the server file
COPY server.js ./

# Cloud Run sets PORT env var — default to 3001 for local testing
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
