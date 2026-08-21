import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(workspaceId: string, data: any) {
    try {
      return await this.prisma.product.create({
        data: {
          workspaceId,
          name: data.name,
          description: data.description,
          sku: data.sku,
          price: parseFloat(data.price),
          taxRate: data.taxRate ? parseFloat(data.taxRate) : 0,
          stockQuantity: data.stockQuantity ? parseInt(data.stockQuantity, 10) : 0,
          hsnCode: data.hsnCode,
        },
      });
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAll(workspaceId: string) {
    return this.prisma.product.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, workspaceId },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(workspaceId: string, id: string, data: any) {
    try {
      return await this.prisma.product.update({
        where: { id, workspaceId },
        data: {
          name: data.name,
          description: data.description,
          sku: data.sku,
          price: data.price ? parseFloat(data.price) : undefined,
          taxRate: data.taxRate ? parseFloat(data.taxRate) : undefined,
          stockQuantity: data.stockQuantity !== undefined ? parseInt(data.stockQuantity, 10) : undefined,
          hsnCode: data.hsnCode,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async deleteProduct(workspaceId: string, id: string) {
    try {
      return await this.prisma.product.deleteMany({
        where: { id, workspaceId },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}