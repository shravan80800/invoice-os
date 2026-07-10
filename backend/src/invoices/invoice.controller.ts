import { Controller, Post, Body, Headers, Logger, InternalServerErrorException, Get, Put, Param, NotFoundException, Delete } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { UseGuards } from '@nestjs/common';
import { ClerkGuard } from '../auth/clerk.guard';

// 🚀 Apply the guard to the whole controller
@UseGuards(ClerkGuard)


@Controller('invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('settings/workspace')
  async getWorkspaceSettings(@Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.workspace.findUnique({ where: { id: workspaceId } });
  }

  @Put('settings/workspace')
  async updateWorkspaceSettings(@Headers('x-workspace-id') workspaceId: string, @Body() body: any) {
    return this.prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {
        companyName: body.companyName,
        address: body.address,
        phone: body.phone,
      },
      create: {
        id: workspaceId,
        name: 'Default Workspace',
        companyName: body.companyName,
        address: body.address,
        phone: body.phone,
      }
    });
  }

  @Post()
  async createInvoice(@Body() body: any, @Headers('x-workspace-id') workspaceId: string) {
    this.logger.log(`Creating invoice for Workspace: ${workspaceId}`);
    try {
      await this.prisma.workspace.upsert({
        where: { id: workspaceId },
        update: {},
        create: { id: workspaceId, name: 'Default Workspace' }
      });

      const customer = await this.prisma.customer.create({
        data: {
          workspaceId,
          name: body.customerName || 'Unknown Customer',
          email: body.customerEmail || 'no-email@example.com',
        }
      });

      return await this.prisma.invoice.create({
        data: {
          workspaceId,
          customerId: customer.id, 
          invoiceNumber: body.invoiceNumber,
          dueDate: new Date(body.dueDate),
          currency: body.currency || 'INR',
          subTotal: body.subTotal,
          taxTotal: body.taxTotal,
          grandTotal: body.grandTotal,
          items: {
            create: body.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
            }))
          }
        },
      });
    } catch (error: any) {
      this.logger.error('Failed to create invoice:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  @Get()
  async getInvoices(@Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' } 
    });
  }

  @Get(':id')
  async getInvoice(@Param('id') id: string, @Headers('x-workspace-id') workspaceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspaceId },
      include: { customer: true, workspace: true, items: true } 
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  @Put(':id/status')
  async updateInvoiceStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Headers('x-workspace-id') workspaceId: string
  ) {
    try {
      return await this.prisma.invoice.updateMany({
        where: { id, workspaceId },
        data: { status: status as any }
      });
    } catch (error) {
      this.logger.error('Failed to update status:', error);
      throw new InternalServerErrorException('Failed to update status');
    }
  }

  // 🚀 NEW: Edit Invoice
  @Put(':id')
  async updateInvoice(
    @Param('id') id: string, 
    @Body() body: any, 
    @Headers('x-workspace-id') workspaceId: string
  ) {
    this.logger.log(`Updating invoice ${id}`);
    try {
      return await this.prisma.invoice.update({
        where: { id },
        data: {
          invoiceNumber: body.invoiceNumber,
          dueDate: new Date(body.dueDate),
          currency: body.currency || 'INR',
          subTotal: body.subTotal,
          taxTotal: body.taxTotal,
          grandTotal: body.grandTotal,
          customer: {
            update: {
              name: body.customerName,
              email: body.customerEmail,
            }
          },
          items: {
            deleteMany: {}, // Clears old items
            create: body.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
            }))
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to update invoice:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  // 🚀 NEW: Delete Invoice
  @Delete(':id')
  async deleteInvoice(@Param('id') id: string, @Headers('x-workspace-id') workspaceId: string) {
    try {
      return await this.prisma.invoice.deleteMany({
        where: { id, workspaceId }
      });
    } catch (error) {
      this.logger.error('Failed to delete invoice:', error);
      throw new InternalServerErrorException('Failed to delete invoice');
    }
  }
}