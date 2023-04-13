FROM alpine:latest
RUN apk update && apk upgrade && apk add git nodejs npm
RUN cd /tmp/ && git clone https://github.com/TR0N-ZEN/Zetti.git
CMD ["node", "/tmp/Zetti/server/main.js"]
