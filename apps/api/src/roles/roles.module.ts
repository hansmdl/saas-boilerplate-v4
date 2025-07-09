import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';

@Module({
  imports: [],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
