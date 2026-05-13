ARG NODE_VERSION=18.0.0

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force

COPY . .

EXPOSE 3001

CMD ["npm", "start"]