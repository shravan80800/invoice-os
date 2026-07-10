import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InvoiceModule } from './invoices/invoice.module'; // <-- Add this
//import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [PrismaModule, InvoiceModule], // <-- Add it here
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}