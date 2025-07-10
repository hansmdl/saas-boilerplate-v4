import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (permite que frontend y otros orígenes hagan peticiones)
  app.enableCors({ origin: true, credentials: true });

  // ✅ Swagger config
  const config = new DocumentBuilder()
    .setTitle('SaaS Boilerplate API')
    .setDescription('Documentación de la API del SaaS Boilerplate')
    .setVersion('1.0')
    .addBearerAuth() // Agrega soporte para JWT Bearer en Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }); // 👉 disponible en http://localhost:3002/docs

  // 👂 Inicia el servidor
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
