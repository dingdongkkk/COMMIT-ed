# 22 is comfortably above the floor (20) that @libsql/client needs.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
COPY public ./public

# The database lives on a mounted volume, never in the image layer.
ENV TURSO_DATABASE_URL=file:/data/data.db
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as the image's unprivileged user, and let it own the volume mount point.
RUN mkdir -p /data && chown -R node:node /data /app
USER node

CMD ["node", "src/server.js"]
