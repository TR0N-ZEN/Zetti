FROM alpine:latest
RUN apk update && apk upgrade && apk add nodejs npm
#CMD ["sleep", "inf"]
WORKDIR /tmp/server
CMD ["node", "main.js"]
