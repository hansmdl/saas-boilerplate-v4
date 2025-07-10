import { Module } from '@nestjs/common';
import { DbModule } from 'db';
import { RolesService } from './roles.service';

@Module({
  imports: [DbModule],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
