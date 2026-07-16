import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController],
})
export class CustomersModule {}