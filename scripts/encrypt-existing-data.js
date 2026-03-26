const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(t) {
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const e = Buffer.concat([c.update(t, 'utf8'), c.final()]);
  return iv.toString('hex') + ':' + c.getAuthTag().toString('hex') + ':' + e.toString('hex');
}

async function run() {
  const p = new PrismaClient();

  const cs = await p.company.findMany();
  console.log('Companies:', cs.length);
  for (const c of cs) {
    if (c.document.includes(':')) { console.log('Skip', c.id); continue; }
    await p.company.update({ where: { id: c.id }, data: { document: encrypt(c.document) } });
    console.log('Encrypted company', c.id);
  }

  const us = await p.user.findMany({ where: { cpf: { not: null } } });
  console.log('Users com CPF:', us.length);
  for (const u of us) {
    if (u.cpf.includes(':')) { console.log('Skip', u.id); continue; }
    await p.user.update({ where: { id: u.id }, data: { cpf: encrypt(u.cpf) } });
    console.log('Encrypted user', u.id);
  }

  await p.$disconnect();
  console.log('Pronto!');
}

run();
