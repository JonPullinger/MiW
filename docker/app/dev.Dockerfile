# Server + client dev mode
FROM node:9-alpine
ENV NODE_ENV=developement

# Runit
RUN apk add --update runit \
	&& rm -rf /var/cache/apk/* \
	&& mkdir /etc/service/app \
	&& echo $'#!/bin/sh\n\
	exec 2>&1\n\
	cd /app\n\
	exec node dist/main.js' > /etc/service/app/run \
	&& chmod +x /etc/service/app/run

# Start
WORKDIR /app
CMD ["runsvdir", "/etc/service"]
EXPOSE 80