FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY api ./api
COPY db ./db
COPY scripts ./scripts
COPY auth ./auth
COPY frontend ./frontend
COPY public ./public
COPY *.html ./
COPY server ./server

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
