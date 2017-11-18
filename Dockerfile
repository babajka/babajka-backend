FROM node:boron

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json secret.json ./

ENV BABAJKA_SECRET="secret.json"

# We don't need --only=production option here: devDependencies are required
# in order to build the app
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "npm", "run", "start-prod" ]
