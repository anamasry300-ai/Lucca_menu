FROM node:18-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/

RUN cd server && npm install --omit=dev

COPY . .

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server/server.js"]
