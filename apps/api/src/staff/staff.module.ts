import { Module } from '@nestjs/common';
import { StaffUsersController } from "./staff.users.controller" 
import { RolesModule } from '../roles/roles.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RolesModule, AuthModule],
  controllers: [StaffUsersController],
})
export class StaffModule {}
