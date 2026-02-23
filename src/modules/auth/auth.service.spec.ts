import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from './email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    machine: {
      count: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company',
        companyDocument: '12345678000190',
        phone: '11999999999',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.company.findUnique.mockResolvedValue(null);
      mockPrismaService.company.create.mockResolvedValue({
        id: 'company-id',
        name: 'Test Company',
        document: '12345678000190',
      });
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'test',
        phone: '5511999999999',
        role: 'COMPANY',
        plan: 'free',
        emailVerified: false,
        company: {
          id: 'company-id',
          name: 'Test Company',
          document: '12345678000190',
        },
      });
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('jwt-token');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'password123',
          companyName: 'Test Company',
          companyDocument: '12345678000190',
          phone: '11999999999',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword,
        emailVerified: true,
        name: 'Test User',
        phone: '5511999999999',
        role: 'COMPANY',
        plan: 'free',
        company: {
          id: 'company-id',
          name: 'Test Company',
        },
      });
      mockPrismaService.machine.count.mockResolvedValue(0);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('jwt-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword,
        emailVerified: false,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
