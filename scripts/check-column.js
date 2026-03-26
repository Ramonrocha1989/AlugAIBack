const { PrismaClient } = require('@prisma/client');

async function run() {
  const p = new PrismaClient();
  const result = await p.$queryRaw`
    SELECT column_name, data_type, character_maximum_length 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cpf'
  `;
  console.log(result);
  await p.$disconnect();
}

run();
