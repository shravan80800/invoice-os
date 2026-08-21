import { Controller, Post, Body, Headers, Logger, InternalServerErrorException, Get, Put, Param, NotFoundException, Delete, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { InvoiceService } from './invoice.service';
import { ClerkGuard } from '../auth/clerk.guard';
import { Resend } from 'resend'; 

@UseGuards(ClerkGuard)
@Controller('invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService 
  ) {}

  @Get('settings/workspace')
  async getWorkspaceSettings(@Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.workspace.findUnique({ where: { id: workspaceId } });
  }

  @Put('settings/workspace')
  async updateWorkspaceSettings(@Headers('x-workspace-id') workspaceId: string, @Body() body: any) {
    return this.prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {
        companyName: body.companyName, // 🚀 FIX: Removed the rogue backticks here!
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

      return await this.invoiceService.createInvoice(workspaceId, body);
      
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
          customerId: body.customerId,
          items: {
            deleteMany: {}, 
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

  @Post(':id/send')
  async sendInvoiceEmail(@Param('id') id: string, @Headers('x-workspace-id') workspaceId: string) {
    this.logger.log(`Initiating email sequence for Invoice ${id}`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id, workspaceId },
        include: { customer: true }
      });

      if (!invoice) throw new NotFoundException('Invoice not found');
      if (!invoice.customer?.email) throw new InternalServerErrorException('Client has no email address on file.');

      const invoiceLink = `${process.env.FRONTEND_URL}/dashboard/invoices/${invoice.id}`;
      
      const { data, error } = await resend.emails.send({
        from: 'InvoiceOS <onboarding@resend.dev>',
        to: [invoice.customer.email],
        subject: `New Invoice ${invoice.invoiceNumber} from InvoiceOS`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: white;">
              <h2 style="margin: 0;">You have a new invoice!</h2>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p style="font-size: 16px;">Hi <strong>${invoice.customer.name}</strong>,</p>
              <p>A new invoice (<strong>${invoice.invoiceNumber}</strong>) has been generated for your recent services.</p>
              
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Amount Due</p>
                <h3 style="margin: 4px 0 0 0; font-size: 24px; color: #0f172a;">
                  ${invoice.currency} ${invoice.grandTotal.toFixed(2)}
                </h3>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #ef4444;">Due by: ${new Date(invoice.dueDate).toDateString()}</p>
              </div>

              <a href="${invoiceLink}" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-align: center;">
                View Full Invoice
              </a>
            </div>
          </div>
        `
      });

      if (error) {
        this.logger.error('Resend API Error:', error);
        throw new InternalServerErrorException('Failed to send email via Resend');
      }

      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'SENT' }
      });

      return { success: true, message: 'Email sent successfully!', data };

    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

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