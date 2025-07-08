import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PasswordResetProcessor } from './password-reset.processor';
import { EmailModule } from './email.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'password-reset' }),
    EmailModule,
  ],
  providers: [PasswordResetProcessor],
  exports: [PasswordResetProcessor],
})
export class PasswordResetModule {}
