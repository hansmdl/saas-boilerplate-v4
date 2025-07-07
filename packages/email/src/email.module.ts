import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from "./email.processor"
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    // No configuramos BullModule.forRoot() aquí porque ya se configura en AuthModule
    BullModule.registerQueue({
      name: 'email',
      // Registramos explícitamente el procesador para asegurarnos de que se active correctamente
      processors: [
        {
          name: 'email-processor',
          path: __dirname + '/email.processor.js',
        },
      ],
    }),
  ],
  controllers: [EmailController], // Exponemos el controlador para poder limpiar la cola
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, EmailProcessor], // Exportamos el procesador también
})
export class EmailModule {}
