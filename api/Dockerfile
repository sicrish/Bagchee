FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["node", "app.js"]
