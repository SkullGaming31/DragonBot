FROM node:20

WORKDIR /app

COPY . /app

COPY package*.json ./

RUN npm install

EXPOSE 3001

COPY .env /app/.env

RUN sed -i 's/Enviroment=dev/Enviroment=prod/g' /app/.env

VOLUME /app/data

CMD ["npm", "run", "prod"]