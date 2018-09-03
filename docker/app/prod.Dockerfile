# Final hierarchi:
# /app = server
# /app/dist = server compiled
# /app/static = client

# Client builder (debian needed for phantomjs and node-gyp)
FROM node:9-stretch as client

# Install dependenses (docker can cache)
COPY client/package*.json /client/
RUN cd /client \
	&& npm install \
	&& npm cache clean --force

# Build
ENV NODE_ENV=production
COPY client /client_src/
COPY server /server
RUN cp -fr /client/* /client_src/. \
	&& rm -fr /client \
	&& mv /client_src /client \
	&& cd /client \
	&& node node_modules/webpack/bin/webpack.js


#
# Server builder
#
FROM node:9-alpine as server

# Install dependenses (docker can cache)
COPY server/package*.json /app/
RUN cd /app \
	&& npm install \
	&& npm cache clean --force

# Build
ENV NODE_ENV=production
COPY server /app_src/
COPY client /client
RUN cp -fr /app/* /app_src/. \
	&& rm -fr /app \
	&& mv /app_src /app \
	&& cd /app \
	&& node node_modules/webpack/bin/webpack.js


#
# Server + client pre-compiled
#
FROM node:9-alpine
ENV NODE_ENV=production

# Install dependenses (docker can cache)
COPY server/package*.json /app/
RUN cd /app \
	&& npm install --only=production \
	&& npm cache clean --force

COPY server/src /app/src
COPY --from=server /app/dist /app/dist/

# Client
COPY --from=client /client/dist /app/static
COPY --from=client /client/dist/index.html /app/src/views/index.ejs

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