## multi-stage image to build & run angular app

########
## build: angular app distribution package 
######## 
FROM node:18.12.0-alpine AS build

# angular build options
ARG NG_BUILD_OPTS

# -- copy app files
USER node
WORKDIR /app
COPY . .

# -- stamp current version (git latest commit message)
USER root
RUN apk add git
RUN git config --global --add safe.directory /app
RUN sh stamp-version.sh

# -- install deps & build distribution
RUN npm install --legacy-peer-deps
RUN echo ${NG_BUILD_OPTS}
RUN npm run ${NG_BUILD_OPTS}

########
## run: run angular app using nginx
########
FROM nginx AS run
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/data-pipe-ui /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
