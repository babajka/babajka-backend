FROM node:boron

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# TODO(uladbohdan): to copy package-lock.json file to ./
COPY package.json secret.json ./

ENV BABAJKA_SECRET="secret.json"

RUN npm install
# TODO(uladbohdan): to consider adding --only=production option.
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
