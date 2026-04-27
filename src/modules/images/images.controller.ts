import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Controller('images')
export class ImagesController {
  private config() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Post('delete')
  async deleteImage(@Body('publicId') publicId: string) {
    if (!publicId) throw new BadRequestException('publicId é obrigatório');

    this.config();

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new BadRequestException(`Erro ao deletar imagem: ${result.result}`);
    }

    return { result: 'ok' };
  }
}
