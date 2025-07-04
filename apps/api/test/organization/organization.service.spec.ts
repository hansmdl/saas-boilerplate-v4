import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../../src/organization/organization.service';
import { PrismaService } from 'db';
import { OrganizationRole, User } from 'db';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an organization and membership', async () => {
      const dto = { name: 'Test Org' };
      const user = { id: 'user1', email: 'test@example.com' } as User;
      const org = { id: 'org1', name: dto.name } as any;

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });

      prisma.organization.create.mockResolvedValue(org as any);
      prisma.organizationMembership.create.mockResolvedValue({
        organizationId: org.id,
        userId: user.id,
        role: OrganizationRole.OWNER,
        createdAt: new Date(),
      });

      const result = await service.create(dto, user);
      expect(result).toEqual(org);
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: { name: dto.name },
      });
      expect(prisma.organizationMembership.create).toHaveBeenCalledWith({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: OrganizationRole.OWNER,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return organizations for a user', async () => {
      const userId = 'user1';
      const orgs = [{ id: 'org1', name: 'Org 1' }] as any;

      prisma.organization.findMany.mockResolvedValue(orgs as any);

      const result = await service.findAll(userId);
      expect(result).toEqual(orgs);
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: { userId },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an organization by id for user', async () => {
      const id = 'org1';
      const userId = 'user1';
      const org = { id, name: 'Org 1' } as any;

      prisma.organization.findFirst.mockResolvedValue(org as any);

      const result = await service.findOne(id, userId);
      expect(result).toEqual(org);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          members: {
            some: { userId },
          },
        },
      });
    });
  });
});
