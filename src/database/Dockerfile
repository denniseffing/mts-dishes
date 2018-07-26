# 1. Build
FROM node:alpine AS build
WORKDIR /app
COPY . /app
RUN yarn
RUN yarn build

# 2. Run
FROM node:alpine
ENV DATABASE_URL 'http://mts-dishes-dynamo:8000'

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

RUN mkdir out
COPY --from=build /app/out/. /usr/src/app/out/.

CMD [ "yarn", "database" ]