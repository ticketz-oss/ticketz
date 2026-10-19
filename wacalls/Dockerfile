FROM golang:1.26-alpine AS build

ARG WACALLS_COMMIT=edeb31f0427aba896639db503153b777a405eccf
ARG WACALLS_SOURCE_SHA256=09de36959a0f378569de2767b985714cc7a9d59c30e9f0ea64f149c386e4dd86
ENV PATH="/usr/local/go/bin:${PATH}"
RUN apk add --no-cache ca-certificates curl patch tar \
    && mkdir -p /src \
    && curl --fail --location --retry 3 \
      --output /tmp/wacalls.tar.gz \
      "https://github.com/JotaDev66/WaCalls/archive/${WACALLS_COMMIT}.tar.gz" \
    && echo "${WACALLS_SOURCE_SHA256}  /tmp/wacalls.tar.gz" | sha256sum -c - \
    && tar -xzf /tmp/wacalls.tar.gz --strip-components=1 -C /src \
    && rm /tmp/wacalls.tar.gz
WORKDIR /src
COPY patches/*.patch /tmp/patches/
RUN for patch_file in /tmp/patches/*.patch; do patch -p1 < "$patch_file"; done
COPY cmd/server/*.go ./cmd/server/
RUN /usr/local/go/bin/go test ./... \
    && CGO_ENABLED=0 GOOS=linux /usr/local/go/bin/go build \
      -trimpath -ldflags="-s -w" -o /out/wacalls ./cmd/server

FROM alpine:3.22

RUN addgroup -S -g 10001 wacalls \
    && adduser -S -D -u 10001 -G wacalls -h /data wacalls
WORKDIR /app
COPY --from=build /out/wacalls /usr/local/bin/wacalls
RUN mkdir -p /data && chown -R wacalls:wacalls /data

USER wacalls
EXPOSE 8080
EXPOSE 50000-50020/udp
VOLUME ["/data"]

ENTRYPOINT ["/usr/local/bin/wacalls", "-addr=:8080", "-db=/data/wacalls.db", "-static=", "-max-calls-per-session=2"]
