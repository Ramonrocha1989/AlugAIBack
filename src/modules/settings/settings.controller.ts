import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/auth.decorators';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Configurações públicas do site' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
