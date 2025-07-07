import { Controller, Post, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Tipo de respuesta para operaciones de cola
 */
export interface QueueResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Controlador para operaciones relacionadas con emails
 * Permite gestionar la cola de emails
 */
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);
  
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue
  ) {
    this.logger.log('Controlador de Email inicializado');
  }

  /**
   * Limpia completamente la cola de emails
   * Útil para entornos de desarrollo o pruebas
   */
  @Post('clear-queue')
  async clearQueue(): Promise<QueueResponse> {
    try {
      await this.emailQueue.obliterate({ force: true });
      this.logger.log('✅ Cola de emails limpiada exitosamente');
      return { success: true, message: 'Cola de emails limpiada exitosamente' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error al limpiar la cola: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
