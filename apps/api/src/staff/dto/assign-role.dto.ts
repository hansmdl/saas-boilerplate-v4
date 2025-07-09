import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'db';

export class AssignRoleDto {
  @ApiProperty({ isArray: true, enum: Role })
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
