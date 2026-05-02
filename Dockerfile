FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the server file
COPY server.js ./

# Cloud Run sets PORT env var — default to 3001 for local testing
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
