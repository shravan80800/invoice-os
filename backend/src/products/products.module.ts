import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path if needed

@Module({
  imports: [PrismaModule], 
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService], // Export in case other modules need inventory access later
})
export class ProductsModule {}