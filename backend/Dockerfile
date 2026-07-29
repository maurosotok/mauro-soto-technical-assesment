FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.work ./
COPY backend/go.mod backend/go.mod
RUN go mod download -C backend
COPY backend backend
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/calculator ./backend

FROM alpine:3.20
RUN addgroup -S calculator && adduser -S -G calculator calculator
COPY --from=build /out/calculator /usr/local/bin/calculator
USER calculator
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1
ENTRYPOINT ["calculator"]