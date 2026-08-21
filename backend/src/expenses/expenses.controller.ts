import { Controller, Get, Post, Delete, Param, Body, Headers } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getExpenses(@Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.expense.findMany({
      where: { workspaceId },
      orderBy: { date: 'desc' },
    });
  }

  @Post()
  async createExpense(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: { amount: number; category: string; description?: string; date?: string }
  ) {
    return this.prisma.expense.create({
      data: {
        workspaceId,
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
  }

  @Delete(':id')
  async deleteExpense(@Param('id') id: string, @Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.expense.delete({
      where: { id, workspaceId },
    });
  }
}