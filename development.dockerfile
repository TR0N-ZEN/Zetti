FROM alpine:latest
RUN apk update && apk upgrade && apk add nodejs npm
CMD ["sleep", "inf"]
