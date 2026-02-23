import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      const email = `test-${Date.now()}@example.com`;
      
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          companyName: 'Test Company',
          companyDocument: `${Date.now()}`,
          phone: '11999999999',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe(email);
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          companyName: 'Test Company',
          companyDocument: `${Date.now()}`,
          phone: '11999999999',
        });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          companyName: 'Test Company 2',
          companyDocument: `${Date.now() + 1}`,
          phone: '11999999998',
        })
        .expect(409);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
