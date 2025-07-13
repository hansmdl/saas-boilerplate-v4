import { Injectable } from '@nestjs/common';
import { PrismaService, User, CustomerRole } from 'db';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    user: Omit<User, 'password'>,
  ) {
    const { name } = createOrganizationDto;

    return this.prisma.$transaction(async (prisma) => {
      const organization = await prisma.organization.create({
        data: {
          name,
        },
      });

      await prisma.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: CustomerRole.OWNER,
        },
      });

      return organization;
    });
  }

  async findAll(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.organization.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });
  }
}
