import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/http-exception.filter';

export function configureApp(app: INestApplication): void {
  const logger = new Logger('HttpAccess');
  const production = process.env.NODE_ENV === 'production';
  const corsConfiguration = process.env.CORS_ORIGINS ?? (production ? '' : 'http://localhost:5173');
  const origins = corsConfiguration
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (production && (origins.length === 0 || origins.includes('*'))) {
    throw new Error('Production requires a non-empty exact CORS_ORIGINS allowlist');
  }
  if (production && process.env.RATE_LIMIT_ENABLED !== 'true') {
    throw new Error('Production requires RATE_LIMIT_ENABLED=true');
  }
  if (production && (process.env.METRICS_ENABLED !== 'true' || !process.env.METRICS_BEARER_TOKEN)) {
    throw new Error('Production requires protected metrics configuration');
  }

  const trustProxy = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (trustProxy > 0) app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const requestId = request.header('x-request-id') ?? randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);
    response.setHeader('Cache-Control', 'no-store');
    response.once('finish', () => logger.log(JSON.stringify({
      event: 'http.request_completed', requestId, method: request.method,
      path: request.originalUrl, status: response.statusCode, durationMs: Date.now() - startedAt
    })));
    next();
  });
  app.enableCors({ origin: origins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'], maxAge: 600 });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  if (!production || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Agent Interview API')
      .setDescription('DevOps interview assistant API')
      .setVersion('v1')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
}
