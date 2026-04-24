import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSettings() {
    const [settings, banners] = await Promise.all([
      this.prisma.siteSetting.findFirst(),
      this.prisma.banner.findMany({ where: { active: true }, orderBy: { orderIndex: 'asc' } }),
    ]);

    return {
      siteName: settings?.siteName || 'BaitaBriq',
      homeTitle: settings?.homeTitle || '',
      homeDescription: settings?.homeDescription || '',
      banners,
      whatsappSupport: settings?.whatsappSupport || '5553984590461',
      phoneSupport: settings?.phoneSupport || '(53) 98459-0461',
      emailSupport: settings?.emailSupport || 'contato@baitabriq.com.br',
      socialLinks: settings?.socialLinks || { instagram: '', facebook: '', youtube: '', linkedin: '' },
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || 'Estamos em manutenção, voltamos em breve!',
    };
  }
}
