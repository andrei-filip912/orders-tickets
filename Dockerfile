FROM node:alpine

WORKDIR /app
COPY package.json .
#--omit=dev # flag ignores the dev dependencies
RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]