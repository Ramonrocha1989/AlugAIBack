FROM node:20-alpine

WORKDIR /app

# Copiar apenas package files
COPY package*.json ./
COPY prisma ./prisma/

# Limpar cache e instalar
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copiar código
COPY . .

# Gerar Prisma e build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
