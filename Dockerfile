FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código
COPY . .

# Gerar Prisma e build
RUN npx prisma generate
RUN npm run build

# Verificar se dist foi criado
RUN ls -la dist/

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
