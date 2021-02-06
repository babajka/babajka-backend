FROM node:15

WORKDIR /babajka

RUN apt-get update && apt-get install -y graphicsmagick

COPY package.json package-lock.json ./
COPY patches/ ./patches/

RUN npm ci --only=production --unsafe-perm

# Creating location to be mounted.
RUN mkdir /babajka/secrets
RUN mkdir /babajka/images-cache
RUN mkdir /babajka/static

COPY . .

EXPOSE 8080

CMD ["npm","run","start-prod","--","--secret-path=/babajka/secrets/secret.json","--images-dir=/babajka/images-cache","--static-dir=/babajka/static"]
