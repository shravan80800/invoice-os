import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpensesController],
})
export class ExpensesModule {}