import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  app.use(cookieParser());
  // CSP and COEP are off: this is a JSON API (no HTML/assets to protect with
  // CSP), and COEP can break cross-origin fetches. HSTS, X-Content-Type-
  // Options, X-Frame-Options, and Referrer-Policy are what staging was
  // missing and are safe defaults for any backend.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Maximus Kratos API')
      .setDescription('Maximus Kratos REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('mk_refresh')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on 0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
