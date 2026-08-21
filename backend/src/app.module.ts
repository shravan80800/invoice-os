import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InvoiceModule } from './invoices/invoice.module'; 
import { WebhooksController } from './webhooks.controller';
import { CustomersModule } from './customers/customers.module'; 
import { ProductsModule } from './products/products.module'; 
import { WorkspacesModule } from './workspaces/workspaces.module'; 
import { ExpensesModule } from './expenses/expenses.module'; // 🚀 NEW: Import this!

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    PrismaModule, 
    InvoiceModule,
    CustomersModule, 
    ProductsModule,
    WorkspacesModule,
    ExpensesModule // 🚀 NEW: Add it to the imports array!
  ],
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}