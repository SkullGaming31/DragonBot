FROM node:20

WORKDIR /app

COPY . /app/

RUN npm install

EXPOSE 3001

RUN sed -i 's/Enviroment=dev/Enviroment=prod/g' .env

RUN npm run build

COPY src/TFD_metadata dist/TFD_metadata

CMD ["npm", "run", "prod"]