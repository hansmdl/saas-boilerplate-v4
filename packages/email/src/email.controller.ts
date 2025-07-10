import { Controller, Post, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
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
@ApiTags('Email')
@Controller('email')
export class EmailController {
  /**
   * Devuelve el estado actual de la cola de emails (waiting, active, completed, failed, etc)
   */
  @ApiOperation({ summary: 'Ver estado de la cola de emails' })
  @ApiOkResponse({ description: 'Estado de la cola', schema: { example: { waiting: 0, active: 0, completed: 10, failed: 1 }}})
  @Get('queue-status')
  async getQueueStatus() {
    return await this.emailQueue.getJobCounts();
  }
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
