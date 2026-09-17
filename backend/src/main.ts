import 'reflect-metadata';
import * as dotenv from 'dotenv';

// Loaded here, before any other local module is required, so that
// process.env is populated before winston.config.ts reads ELASTICSEARCH_NODE
// at module-evaluation time. ConfigModule's own dotenv loading (in
// app.module.ts) happens too late for that: it runs during Nest's module
// instantiation, after this file's imports have already been evaluated.
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonModuleOptions } from './common/logging/winston.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonModuleOptions),
  });
  const logger = new Logger('Bootstrap');

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Pulse Survey API listening on port ${port}`);
}

bootstrap();
