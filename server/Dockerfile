# Use the official Node.js LTS image
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
