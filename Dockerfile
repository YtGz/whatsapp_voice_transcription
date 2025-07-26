FROM node:slim

WORKDIR /app

RUN apt-get update && apt-get install -y git

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]