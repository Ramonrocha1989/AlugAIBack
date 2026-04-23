const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Tratores', slug: 'tratores', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946321/hqp8r1wxlb19ximoix8q.png', order: 1 },
  { name: 'Colheitadeiras', slug: 'colheitadeiras', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946322/eahmqg4yxxmj3pbxnm71.png', order: 2 },
  { name: 'Plantio e Semeadura', slug: 'plantio-e-semeadura', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946324/evnvhoc1zggzr8ngzqdn.png', order: 3 },
  { name: 'Pulverização', slug: 'pulverizacao', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946326/csfybeprdhlz5sdihxzs.png', order: 4 },
  { name: 'Fenação e Silagem', slug: 'fenacao-e-silagem', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946327/p0y3xj5vbmpzyjjmkn9m.png', order: 5 },
  { name: 'Implementos e Acoplados', slug: 'implementos-e-acoplados', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946328/hfqkj7a6n5qe9fqjdheq.png', order: 6 },
  { name: 'Pecuária e Outros', slug: 'pecuaria-e-outros', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946329/kk4kidnnawqsqfvg0pv8.png', order: 7 },
  { name: 'Construção (Linha Amarela)', slug: 'construcao-linha-amarela', icon: 'https://res.cloudinary.com/dwpzsdugu/image/upload/v1776946331/ufxatzmxebbrgclzsabh.png', order: 8 },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: { icon: cat.icon }, create: cat });
  }
  console.log(`${categories.length} categorias criadas/atualizadas`);
}

main().finally(() => prisma.$disconnect());
