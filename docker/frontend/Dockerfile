FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --force

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

COPY --from=build /usr/src/app/dist/template/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
