import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Security Headers (Blocks common XSS and clickjacking attacks)
  app.use(helmet());

  // 2. Strict CORS (Only your specific frontend domain is allowed)
  const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000'];

  app.enableCors({
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:3000'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: 'Content-Type, Accept, Authorization',
});

  // 3. Payload limits (Protects against Denial of Service via massive file uploads)
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // 4. Dynamic Port binding (Required by hosts like Render/Railway)
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();