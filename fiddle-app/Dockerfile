# example
# create a production build
FROM node:carbon as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm install react-scripts@1.1.1 -g
RUN npm run build

#serve the built app
FROM node:carbon
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build .
CMD [ "serve", "-p", "8080", "-s", "."]
