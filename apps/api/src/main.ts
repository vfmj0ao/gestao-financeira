import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const origins = readOrigins();
  const port = Number(process.env.PORT ?? 3001);

  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port, '0.0.0.0');
}

function readOrigins(): string[] {
  const raw = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  const origins = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return origins.length > 0 ? origins : ['http://localhost:3000'];
}

void bootstrap();
