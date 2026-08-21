FROM node:24-alpine

WORKDIR /app
COPY deploy/forms/package.json deploy/forms/package-lock.json ./
RUN npm ci --omit=dev
COPY deploy/forms/server.mjs deploy/forms/validation.mjs ./

ENV NODE_ENV=production
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.mjs"]
