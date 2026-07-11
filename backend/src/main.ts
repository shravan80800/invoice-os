import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Strict CORS - 'origin: true' dynamically accepts the request origin
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    // 👇 THE FIX: x-workspace-id is now explicitly allowed
    allowedHeaders: 'Content-Type, Accept, Authorization, x-workspace-id', 
  });

  // 2. Security Headers - Disable the cross-origin policy so Helmet allows Vercel
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // 3. Payload limits (Protects against Denial of Service via massive file uploads)
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // 4. Dynamic Port binding (Required by hosts like Render/Railway)
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();