FROM node:20-alpine AS deps

WORKDIR /app
# Increase npm robustness for unstable networks
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./
RUN npm ci || (sleep 5 && npm ci)

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN (npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --omit=dev --ignore-scripts) || \
    (sleep 5 && npm ci --omit=dev --ignore-scripts)

COPY --from=build /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/index.js"]

