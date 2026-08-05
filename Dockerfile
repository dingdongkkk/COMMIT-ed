# Node 24 is the floor: node:sqlite needs a flag on anything older.
FROM node:24-alpine

WORKDIR /app

# No dependencies to install — the app is stdlib only — so this is just source.
COPY package.json ./
COPY src ./src
COPY public ./public

# The database lives on a mounted volume, never in the image layer.
ENV DATABASE_URL=/data/data.db
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as the image's unprivileged user, and let it own the volume mount point.
RUN mkdir -p /data && chown -R node:node /data /app
USER node

CMD ["node", "src/server.js"]
