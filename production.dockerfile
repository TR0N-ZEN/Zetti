FROM alpine:latest
RUN apk update && apk upgrade && apk add git nodejs npm
RUN cd /tmp/ && git clone https://github.com/TR0N-ZEN/Zetti.git && cd /tmp/Zetti/server/
RUN cd /tmp/Zetti/server/ && npm install
CMD ["node", "/tmp/Zetti/server/main.js"]
