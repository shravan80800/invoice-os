import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { ClerkGuard } from '../auth/clerk.guard'; // Adjust path based on your folder structure

@UseGuards(ClerkGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Headers('x-workspace-id') workspaceId: string, @Body() body: any) {
    return this.productService.createProduct(workspaceId, body);
  }

  @Get()
  async getProducts(@Headers('x-workspace-id') workspaceId: string) {
    return this.productService.findAll(workspaceId);
  }

  @Get(':id')
  async getProduct(@Headers('x-workspace-id') workspaceId: string, @Param('id') id: string) {
    return this.productService.findOne(workspaceId, id);
  }

  @Put(':id')
  async updateProduct(
    @Headers('x-workspace-id') workspaceId: string, 
    @Param('id') id: string, 
    @Body() body: any
  ) {
    return this.productService.updateProduct(workspaceId, id, body);
  }

  @Delete(':id')
  async deleteProduct(@Headers('x-workspace-id') workspaceId: string, @Param('id') id: string) {
    return this.productService.deleteProduct(workspaceId, id);
  }
}