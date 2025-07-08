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
    // No configuramos BullModule.forRoot() aquí porque ya se configura en AuthModule
    // En este enfoque, no configuramos procesadores externos
    // Lo que hacemos es usar el decorador @Processor y dejar que NestJS se encargue
    // Esto evita que BullMQ intente cargar archivos desde rutas del sistema
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'password-reset' },
    ),
  ],
  controllers: [EmailController], // Exponemos el controlador para poder limpiar la cola
  providers: [EmailService, EmailProcessor, PasswordResetProcessor],
  exports: [EmailService, EmailProcessor, PasswordResetProcessor], // Exportamos ambos procesadores
})
export class EmailModule {}
