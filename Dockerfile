FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/

RUN npm install --ignore-scripts && \
    npm run build -w packages/shared && \
    npm run build -w packages/backend

EXPOSE 3001

CMD ["node", "packages/backend/dist/index.js"]
