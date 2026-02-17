import { Injectable } from '@nestjs/common';

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxAds: number;
  features: string[];
}

@Injectable()
export class PlansService {
  private readonly plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      maxAds: 3,
      features: [
        'Até 3 anúncios ativos',
        '5 fotos por anúncio',
        'Suporte por email',
      ],
    },
    {
      id: 'lojista',
      name: 'Lojista',
      price: 1,
      maxAds: -1,
      features: [
        'Anúncios ilimitados',
        '15 fotos por anúncio',
        'Selo Vendedor Verificado',
        'Prioridade nas buscas',
        'Suporte prioritário',
      ],
    },
  ];

  findAll(): Plan[] {
    return this.plans;
  }

  findOne(id: string): Plan | undefined {
    return this.plans.find(plan => plan.id === id);
  }
}
