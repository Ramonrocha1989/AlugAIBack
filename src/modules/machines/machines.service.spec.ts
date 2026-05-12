import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { PrismaService } from '../../common/prisma.service';

describe('MachinesService', () => {
  let service: MachinesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    machine: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MachinesService>(MachinesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a machine successfully', async () => {
      const createDto: any = {
        name: 'Trator John Deere',
        category: 'tratores',
        businessType: 'SALE',
        description: 'Test description',
        price: 100000,
        yearModel: 2020,
        manufacturer: 'John Deere',
        model: '6110J',
        state: 'RS',
        city: 'Porto Alegre',
        acceptsTradeDown: false,
        acceptsTradeUp: false,
        acceptsGrains: false,
        available: true,
        status: 'ACTIVE',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        plan: 'lojista',
        maxAds: 999,
        isVerifiedSeller: false,
      });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'category-id' });
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'lojista', maxAds: 999, maxPhotos: 15, maxVideos: 1, adDuration: -1 });
      mockPrismaService.machine.count.mockResolvedValue(0);
      mockPrismaService.machine.create.mockResolvedValue({
        id: 'machine-id',
        ...createDto,
        ownerId: 'user-id',
        owner: {
          id: 'user-id',
          name: 'Test User',
          isVerifiedSeller: false,
        },
      });

      const result = await service.create('user-id', 'Test User', createDto);

      expect(result.name).toBe('Trator John Deere');
      expect(mockPrismaService.machine.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if free plan limit reached', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        plan: 'free',
        maxAds: 3,
        isVerifiedSeller: false,
      });
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'category-id' });
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'free', maxAds: 3, maxPhotos: 3, maxVideos: 0, adDuration: 30 });
      mockPrismaService.machine.count.mockResolvedValue(3);

      await expect(
        service.create('user-id', 'Test User', {
          name: 'Test Machine',
          category: 'tratores',
          businessType: 'SALE',
          description: 'Test',
          price: 100000,
          yearModel: 2020,
          manufacturer: 'Test',
          model: 'Test',
          state: 'RS',
          city: 'Test',
          acceptsTradeDown: false,
          acceptsTradeUp: false,
          acceptsGrains: false,
          available: true,
          status: 'ACTIVE',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should reject inactive or unknown category filters', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.findAll({ category: 'categoria-invalida' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should apply acceptsFinancing filter', async () => {
      mockPrismaService.machine.findMany.mockResolvedValue([]);
      mockPrismaService.machine.count.mockResolvedValue(0);

      await service.findAll({ acceptsFinancing: true } as any);

      expect(mockPrismaService.machine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ acceptsFinancing: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a machine by id', async () => {
      mockPrismaService.machine.findUnique.mockResolvedValue({
        id: 'machine-id',
        name: 'Test Machine',
        owner: {
          id: 'user-id',
          name: 'Test User',
          phone: '5511999999999',
          isVerifiedSeller: false,
        },
      });

      const result = await service.findOne('machine-id');

      expect(result.name).toBe('Test Machine');
    });

    it('should throw NotFoundException if machine not found', async () => {
      mockPrismaService.machine.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a machine successfully', async () => {
      mockPrismaService.machine.findUnique.mockResolvedValue({
        id: 'machine-id',
        ownerId: 'user-id',
      });
      mockPrismaService.machine.delete.mockResolvedValue({});

      const result = await service.remove('machine-id', 'user-id');

      expect(result.message).toBe('Máquina deletada com sucesso');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrismaService.machine.findUnique.mockResolvedValue({
        id: 'machine-id',
        ownerId: 'other-user-id',
      });

      await expect(service.remove('machine-id', 'user-id')).rejects.toThrow(ForbiddenException);
    });
  });
});
