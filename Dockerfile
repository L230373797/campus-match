FROM node:22-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY netlify ./netlify
COPY server ./server
COPY scripts/lib ./scripts/lib

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "standalone"]
