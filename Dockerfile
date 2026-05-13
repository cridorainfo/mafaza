# Production image: Vite dashboard (static) + Express API for Railway
FROM node:20-alpine AS dashboard-build
WORKDIR /src/dashboard
COPY dashboard/package.json dashboard/package-lock.json dashboard/.npmrc ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
RUN mkdir -p database/migrations database/seeders
COPY --from=dashboard-build /src/dashboard/dist ./public
RUN mkdir -p public/uploads
EXPOSE 8080
CMD ["node", "server.js"]
