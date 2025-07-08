import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { EmailModule, PasswordResetModule } from 'email';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '../../../.env')],
    }),
    AuthModule,
    OrganizationModule,
    EmailModule,
    PasswordResetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
