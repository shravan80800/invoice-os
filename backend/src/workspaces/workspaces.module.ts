import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController],
})
export class WorkspacesModule {}