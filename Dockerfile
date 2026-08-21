FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PUBLIC_UMAMI_SRC
ARG PUBLIC_UMAMI_WEBSITE_ID
ENV PUBLIC_UMAMI_SRC=${PUBLIC_UMAMI_SRC}
ENV PUBLIC_UMAMI_WEBSITE_ID=${PUBLIC_UMAMI_WEBSITE_ID}
RUN npm run build

FROM nginx:1.28-alpine
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/telliapps-security.conf /etc/nginx/snippets/telliapps-security.conf
COPY deploy/nginx/forms-proxy.conf /etc/nginx/snippets/forms-proxy.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider --header='Host: www.telli-apps.de' http://127.0.0.1:8080/healthz || exit 1
