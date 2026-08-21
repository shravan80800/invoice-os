import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(workspaceId: string, data: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Fetch Workspace and Customer to determine Place of Supply
        const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });
        const customer = await tx.customer.findUnique({ where: { id: data.customerId } });

        // 🚀 X-RAY LOGS: Watch the NestJS terminal when you save an invoice!
        console.log(`\n🔥 --- GST ENGINE TRIGGERED (CREATE) --- 🔥`);
        console.log(`Workspace State: ${workspace?.state}`);
        console.log(`Customer State: ${customer?.state}`);
        console.log(`Tax Total from form: ${data.taxTotal}`);

        let taxType = 'NONE';
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        // 2. The GST Decision Engine
        if (workspace?.state && customer?.state && data.taxTotal > 0) {
          if (workspace.state.trim().toLowerCase() === customer.state.trim().toLowerCase()) {
            console.log(`✅ MATCH! Applying CGST & SGST Split`);
            taxType = 'CGST_SGST';
            cgstTotal = data.taxTotal / 2;
            sgstTotal = data.taxTotal / 2;
          } else {
            console.log(`✈️ DIFFERENT STATES! Applying IGST`);
            taxType = 'IGST';
            igstTotal = data.taxTotal;
          }
        } else {
          console.log(`❌ FAILED: Missing states or zero tax.`);
        }
        console.log(`Resulting Tax Type: ${taxType}\n`);

        const invoice = await tx.invoice.create({
          data: {
            workspaceId,
            customerId: data.customerId,
            invoiceNumber: data.invoiceNumber,
            status: data.status || 'DRAFT',
            issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
            dueDate: new Date(data.dueDate),
            currency: data.currency || 'INR',
            subTotal: data.subTotal,
            taxTotal: data.taxTotal,
            grandTotal: data.grandTotal,
            
            // Save the calculated GST splits to the database
            taxType,
            cgstTotal,
            sgstTotal,
            igstTotal,

            items: {
              create: data.items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                productId: item.productId || null, 
              })),
            },
          },
          include: { items: true, customer: true }
        });

        // 3. Smart Stock Deduction
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
              });
            }
          }
        }
        return invoice;
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new InternalServerErrorException('Could not process the invoice transaction.');
    }
  }

  async updateInvoice(workspaceId: string, id: string, data: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        
        // 1. Fetch Workspace and Customer to recalculate Place of Supply on edit
        const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });
        const customer = await tx.customer.findUnique({ where: { id: data.customerId } });

        // 🚀 X-RAY LOGS
        console.log(`\n🔥 --- GST ENGINE TRIGGERED (UPDATE) --- 🔥`);
        console.log(`Workspace State: ${workspace?.state}`);
        console.log(`Customer State: ${customer?.state}`);
        console.log(`Tax Total from form: ${data.taxTotal}`);

        let taxType = 'NONE';
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        // 2. The GST Decision Engine
        if (workspace?.state && customer?.state && data.taxTotal > 0) {
          if (workspace.state.trim().toLowerCase() === customer.state.trim().toLowerCase()) {
            console.log(`✅ MATCH! Applying CGST & SGST Split`);
            taxType = 'CGST_SGST';
            cgstTotal = data.taxTotal / 2;
            sgstTotal = data.taxTotal / 2;
          } else {
            console.log(`✈️ DIFFERENT STATES! Applying IGST`);
            taxType = 'IGST';
            igstTotal = data.taxTotal;
          }
        } else {
          console.log(`❌ FAILED: Missing states or zero tax.`);
        }
        console.log(`Resulting Tax Type: ${taxType}\n`);

        // 3. Fetch old items and REFUND stock back to inventory
        const oldInvoice = await tx.invoice.findUnique({
          where: { id, workspaceId },
          include: { items: true }
        });

        if (oldInvoice) {
          for (const oldItem of oldInvoice.items) {
            if (oldItem.productId) {
              await tx.product.update({
                where: { id: oldItem.productId },
                data: { stockQuantity: { increment: oldItem.quantity } }
              });
            }
          }
        }

        // 4. Update the invoice and wipe old items, inserting new ones
        const updatedInvoice = await tx.invoice.update({
          where: { id, workspaceId },
          data: {
            invoiceNumber: data.invoiceNumber,
            customerId: data.customerId,
            dueDate: new Date(data.dueDate),
            status: data.status,
            currency: data.currency || 'INR',
            subTotal: data.subTotal,
            taxTotal: data.taxTotal,
            grandTotal: data.grandTotal,
            
            // Update the calculated GST splits
            taxType,
            cgstTotal,
            sgstTotal,
            igstTotal,

            items: {
              deleteMany: {},
              create: data.items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                productId: item.productId || null, 
              })),
            }
          }
        });

        // 5. Loop through the NEW items and deduct their stock
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } }
              });
            }
          }
        }

        return updatedInvoice;
      });
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw new InternalServerErrorException('Could not process the invoice update.');
    }
  }

  async findAll(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      include: { customer: true,
        items: true
       },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, workspaceId },
      include: { customer: true, items: true, workspace: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found.`);
    return invoice;
  }
}