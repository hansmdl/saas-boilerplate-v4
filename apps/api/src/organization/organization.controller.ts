import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  type CreateOrganizationDto,
} from './dto/create-organization.dto';
import { OrganizationService } from './organization.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from 'db';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.organizationService.create(createOrganizationDto, user);
  }

  @Get()
  async findAll(@CurrentUser() user: Omit<User, 'password'>) {
    return this.organizationService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: Omit<User, 'password'>) {
    return this.organizationService.findOne(id, user.id);
  }
}
