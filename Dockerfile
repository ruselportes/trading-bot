FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

RUN npm ci --workspace packages/shared --workspace packages/backend --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/

RUN npm run build -w packages/shared && npm run build -w packages/backend

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/backend/package.json ./packages/backend/
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3001

CMD ["node", "packages/backend/dist/index.js"]
