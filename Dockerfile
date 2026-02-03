FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install  # o pnpm install se usi pnpm

COPY . .
RUN npm run build  # se hai build step

EXPOSE 3000
CMD ["npm", "run", "dev"]  # o "start" per prod
