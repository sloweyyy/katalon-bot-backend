import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.enableCors();

    const config = new DocumentBuilder()
      .setTitle('Katalon Support Bot API')
      .setDescription('API documentation for the Katalon Support Bot')
      .setVersion('1.0')
      .addTag('chat', 'Chat conversation endpoints')
      .addTag('mcp', 'Model Context Protocol endpoints')
      .addTag('gemini', 'Gemini API integration endpoints')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port', 3000);

    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
    logger.log(`API documentation available at http://localhost:${port}/api`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(
      `Error during application bootstrap: ${errorMessage}`,
      errorStack,
    );
    process.exit(1);
  }
}

void bootstrap();
