FROM node:22-alpine

WORKDIR /app

# Install only the 3 packages server.js actually needs
# Bypasses package-lock.json compatibility issues entirely
RUN npm install express@^4 node-fetch@^3 dotenv@^16 --no-save

COPY server.js ./

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
