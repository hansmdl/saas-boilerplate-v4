import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Scopes } from '../common/decorators/scopes.decorator';
import { ScopesGuard } from '../common/guards/scopes.guard';

@Controller('staff/users')
export class StaffUsersController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Asigna roles a un usuario. Requiere scope "user:update" y estar autenticado.
   */
  @Patch(':id/roles')
  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Scopes('user:update')
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    // Por simplicidad asumimos un solo rol (primer elemento)
    const role = dto.roles[0];
    return this.rolesService.assignRole(id, role);
  }
}
