FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@latest && npm install --no-package-lock

COPY server.js ./

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
