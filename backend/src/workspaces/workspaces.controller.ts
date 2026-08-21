import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getWorkspace(@Headers('x-workspace-id') workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
  }

  @Put()
  async updateWorkspace(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: any,
  ) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        companyName: data.companyName,
        address: data.address,
        phone: data.phone,
        gstin: data.gstin,
        state: data.state,
      },
    });
  }
}