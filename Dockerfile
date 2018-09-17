# 1. Build
FROM node:alpine AS build
WORKDIR /app
COPY . /app
RUN yarn
RUN yarn build

# 2. Run
FROM node:alpine
ENV DATABASE_URL 'http://mts-dishes-dynamo:8000'
ENV PORT 8080
ENV INFO_PORT 8081

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

RUN mkdir out
COPY --from=build /app/out/. /usr/src/app/out/.
EXPOSE 8080
EXPOSE 8081
CMD [ "npm", "start" ]