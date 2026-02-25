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
    
    // Clean database before tests
    await prisma.deleteToken.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    
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
          phone: '11999999999',
        });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          companyName: 'Test Company 2',
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

  describe('/api/auth/profile (PUT)', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      const email = `profile-test-${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Password123!',
          companyName: 'Profile Test Company',
          phone: '11999999999',
        });

      accessToken = response.body.accessToken;
      userId = response.body.user.id;

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
    });

    it('should update user profile with name', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.name).toBe('Updated Name');
          expect(res.body.message).toBe('Perfil atualizado com sucesso');
        });
    });

    it('should update user profile with phone', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '11988887777' })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.phone).toBe('11988887777');
        });
    });

    it('should update both name and phone', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Name', phone: '11977776666' })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.name).toBe('New Name');
          expect(res.body.user.phone).toBe('11977776666');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should return 400 for invalid phone format', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: 'invalid' })
        .expect(400);
    });
  });
});
