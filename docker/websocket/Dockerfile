FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY websocket-server.cjs ./websocket-server.cjs

ENV WS_PORT=6001
EXPOSE 6001

CMD ["node", "websocket-server.cjs"]
