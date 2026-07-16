import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InvoiceModule } from './invoices/invoice.module'; 
import { WebhooksController } from './webhooks.controller';
import { CustomersModule } from './customers/customers.module'; // <-- 1. Import it here

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Good practice to keep active for env vars
    PrismaModule, 
    InvoiceModule,
    CustomersModule // <-- 2. Register it here
  ],
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}