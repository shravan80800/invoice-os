import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path to your Prisma service

@Controller('customers')
export class CustomersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getCustomers(@Headers('x-workspace-id') workspaceId: string) {
    if (!workspaceId) throw new UnauthorizedException('Workspace ID missing');
    
    return this.prisma.customer.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { invoices: true } } // Counts how many invoices this client has
      }
    });
  }

  @Post()
  async createCustomer(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: { name: string; email?: string; address?: string; taxId?: string }
  ) {
    if (!workspaceId) throw new UnauthorizedException('Workspace ID missing');
    return this.prisma.customer.create({
      data: { ...body, workspaceId },
    });
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: { name: string; email?: string; address?: string; taxId?: string }
  ) {
    return this.prisma.customer.update({
      where: { id, workspaceId },
      data: body,
    });
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string, @Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.customer.delete({
      where: { id, workspaceId },
    });
  }
}