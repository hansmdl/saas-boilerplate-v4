import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from "./email.processor"
import { PasswordResetProcessor } from './password-reset.processor';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { pathToFileURL } from 'url';
import * as path from 'path';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, EmailProcessor],
})
export class EmailModule {}
