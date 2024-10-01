FROM node:latest as build

USER root

RUN apt-get update

WORKDIR /hdb-ui

COPY hdb-ui/package.json ./package.json
COPY hdb-ui/package-lock.json ./package-lock.json

RUN npm install