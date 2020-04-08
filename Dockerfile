## multi-stage image to build & run angular app

########
## build: angular app distribution package 
######## 
FROM node:12.14.1-alpine AS build

# angular build options
ARG NG_BUILD_OPTS

# -- git is required to stamp current version into app
RUN apk --no-cache add git

# -- copy app files
USER node
WORKDIR /app
COPY . .

# -- stamp current version (git latest commit message)
USER root
RUN sh stamp-version.sh

# -- install deps & build distribution
RUN npm install
RUN echo ${NG_BUILD_OPTS}
RUN npm run ${NG_BUILD_OPTS}

########
## run: run angular app using nginx
########
FROM nginx AS run
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/DataPipeUI /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
