import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Machines (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    const email = `test-machines-${Date.now()}@example.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        companyName: 'Test Company',
        companyDocument: `${Date.now()}`,
        phone: '11999999999',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/machines (POST)', () => {
    it('should create a machine', () => {
      return request(app.getHttpServer())
        .post('/api/machines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Trator Test John Deere 6110J',
          category: 'TRACTORS',
          businessType: 'SALE',
          description: 'Trator em excelente estado de conservação, revisado, com todos os documentos em dia e pronto para trabalho.',
          price: 100000,
          yearModel: 2020,
          manufacturer: 'John Deere',
          model: '6110J',
          state: 'RS',
          city: 'Porto Alegre',
          images: ['https://example.com/image1.jpg'],
          acceptsTradeDown: false,
          acceptsTradeUp: false,
          acceptsGrains: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toContain('Trator Test');
          expect(res.body.ownerId).toBe(userId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/machines')
        .send({
          name: 'Trator Test John Deere 6110J',
          category: 'TRACTORS',
          businessType: 'SALE',
          description: 'Trator em excelente estado de conservação, revisado, com todos os documentos em dia e pronto para trabalho.',
          price: 100000,
          yearModel: 2020,
          manufacturer: 'John Deere',
          model: '6110J',
          state: 'RS',
          city: 'Porto Alegre',
          images: ['https://example.com/image1.jpg'],
          acceptsTradeDown: false,
          acceptsTradeUp: false,
          acceptsGrains: false,
        })
        .expect(401);
    });
  });

  describe('/api/machines (GET)', () => {
    it('should list machines', () => {
      return request(app.getHttpServer())
        .get('/api/machines')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.meta).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
