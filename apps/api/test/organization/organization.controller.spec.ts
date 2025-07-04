import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from '../../src/organization/organization.controller';
import { OrganizationService } from '../../src/organization/organization.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { CreateOrganizationDto } from '../../src/organization/dto/create-organization.dto'
import { User } from 'db';

const mockUser = { id: 'user1', email: 'test@example.com' } as User;

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let organizationService: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an organization', async () => {
      const dto: CreateOrganizationDto = { name: 'Test Org' };
      const org = { id: 'org1', ...dto };

      jest.spyOn(organizationService, 'create').mockResolvedValue(org as any);

      const result = await controller.create(dto, mockUser);
      expect(result).toEqual(org);
      expect(organizationService.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return organizations', async () => {
      const orgs = [{ id: 'org1', name: 'Org 1' }];
      jest.spyOn(organizationService, 'findAll').mockResolvedValue(orgs as any);

      const result = await controller.findAll(mockUser);
      expect(result).toEqual(orgs);
      expect(organizationService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return an organization by id', async () => {
      const id = 'org1';
      const org = { id, name: 'Org 1' };
      jest.spyOn(organizationService, 'findOne').mockResolvedValue(org as any);

      const result = await controller.findOne(id, mockUser);
      expect(result).toEqual(org);
      expect(organizationService.findOne).toHaveBeenCalledWith(id, mockUser.id);
    });
  });
});
