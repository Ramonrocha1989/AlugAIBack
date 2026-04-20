import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      maxAds: 2,
      maxPhotos: 3,
      maxVideos: 0,
      adDuration: 30,
      maxPremiumAds: 0,
      maxFeaturedAds: 0,
      hasAnalytics: false,
      analyticsLevel: 'none',
      hasPriority: false,
      hasStorePage: false,
      hasVerifiedBadge: false,
      supportLevel: 'email_48h',
      features: [
        '2 anúncios ativos',
        '3 fotos por anúncio',
        'Anúncios válidos por 30 dias',
        'Suporte por email (48h)',
      ],
    },
    {
      id: 'basico',
      name: 'Básico',
      price: 89,
      maxAds: 8,
      maxPhotos: 8,
      maxVideos: 0,
      adDuration: -1,
      maxPremiumAds: 0,
      maxFeaturedAds: 0,
      hasAnalytics: true,
      analyticsLevel: 'basic',
      hasPriority: false,
      hasStorePage: false,
      hasVerifiedBadge: true,
      supportLevel: 'email_24h',
      features: [
        '8 anúncios ativos',
        '8 fotos por anúncio',
        'Anúncios ativos enquanto o plano estiver pago',
        'Analytics básico (views + cliques)',
        'Badge "Anunciante"',
        'Suporte por email (24h)',
      ],
    },
    {
      id: 'profissional',
      name: 'Profissional',
      price: 179,
      maxAds: 20,
      maxPhotos: 15,
      maxVideos: 1,
      adDuration: -1,
      maxPremiumAds: 3,
      maxFeaturedAds: 2,
      hasAnalytics: true,
      analyticsLevel: 'full',
      hasPriority: true,
      hasStorePage: false,
      hasVerifiedBadge: true,
      supportLevel: 'whatsapp_12h',
      features: [
        '20 anúncios ativos',
        '15 fotos por anúncio',
        '1 vídeo por anúncio',
        'Anúncios ativos enquanto o plano estiver pago',
        '3 anúncios Premium simultâneos',
        '2 anúncios Destaque simultâneos',
        'Analytics completo',
        'Badge "Vendedor Verificado"',
        'Prioridade nos resultados',
        'Suporte por WhatsApp (12h)',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 349,
      maxAds: 50,
      maxPhotos: 25,
      maxVideos: 3,
      adDuration: -1,
      maxPremiumAds: 8,
      maxFeaturedAds: 5,
      hasAnalytics: true,
      analyticsLevel: 'premium',
      hasPriority: true,
      hasStorePage: true,
      hasVerifiedBadge: true,
      supportLevel: 'whatsapp_4h',
      features: [
        '50 anúncios ativos',
        '25 fotos por anúncio',
        '3 vídeos por anúncio',
        'Anúncios ativos enquanto o plano estiver pago',
        '8 anúncios Premium simultâneos',
        '5 anúncios Destaque simultâneos',
        'Analytics premium + relatório de mercado',
        'Badge "Loja Premium"',
        'Prioridade máxima nos resultados',
        'Página da loja personalizada',
        'Selo de confiança',
        'Suporte WhatsApp dedicado (4h)',
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  // Migrar planos antigos
  await prisma.user.updateMany({
    where: { plan: 'lojista' },
    data: { plan: 'basico' },
  });
  await prisma.user.updateMany({
    where: { plan: 'FREE' },
    data: { plan: 'free' },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
