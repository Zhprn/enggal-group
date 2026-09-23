import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import serverlessExpress from '@codegenie/serverless-express';

let cachedHandler: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    Object.assign(process.env, env);

    if (!cachedHandler) {
      cachedHandler = await bootstrap();
    }

    return new Promise((resolve, reject) => {
      const url = new URL(request.url);
      const event = {
        httpMethod: request.method,
        path: url.pathname,
        queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body ? request.text() : undefined,
      };

      cachedHandler(event, ctx, (err: any, response: any) => {
        if (err) return reject(err);
        resolve(
          new Response(response.body, {
            status: response.statusCode,
            headers: response.headers,
          }),
        );
      });
    });
  },
};