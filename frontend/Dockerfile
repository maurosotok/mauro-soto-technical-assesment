FROM node:20-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN npm ci && \
    ROLLDOWN_VERSION="$(node -p "require('./node_modules/rolldown/package.json').version")" && \
    LIGHTNINGCSS_VERSION="$(node -p "require('./node_modules/lightningcss/package.json').version")" && \
    npm install --no-save \
      "@rolldown/binding-linux-x64-musl@${ROLLDOWN_VERSION}" \
      "lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION}"
COPY frontend frontend
RUN npm run build --workspace frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1