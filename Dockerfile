FROM node:18
WORKDIR /definer
COPY package*.json ./
RUN npm ci
# COPY . .
COPY ./app ./
COPY ./prisma ./
COPY ./public ./
COPY ./workers ./
COPY ./remix* ./
COPY ./tailwind* ./
COPY ./tsc* ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]