# API only (use with docker-compose where the dashboard runs separately)
FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
