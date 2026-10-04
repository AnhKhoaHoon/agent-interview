FROM node:22-alpine AS build

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig*.json backend/nest-cli.json ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node backend/migrations ./migrations
COPY --chown=node:node backend/scripts ./scripts
COPY --chown=node:node knowledge ./knowledge

USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && exec npm run start"]
