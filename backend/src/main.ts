import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
    { rawBody: true },
  );
  const config = app.get(ConfigService);

  await app.register(helmet);
  await app.register(cors, {
    origin: config.getOrThrow<string>('CORS_ORIGINS').split(','),
    credentials: true,
  });
  await app.register(multipart, {
    limits: {
      files: 10,
      fileSize: 50 * 1024 * 1024,
    },
  });

  app.setGlobalPrefix(config.getOrThrow<string>('APP_GLOBAL_PREFIX'));
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auction API')
    .setDescription('Cars and gadgets auction backend')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(
    config.getOrThrow<number>('APP_PORT'),
    config.getOrThrow<string>('APP_HOST'),
  );
}

void bootstrap();
