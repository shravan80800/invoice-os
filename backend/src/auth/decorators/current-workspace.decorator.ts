import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const CurrentWorkspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspaceId = request.headers['x-workspace-id'];
    
    if (!workspaceId) {
      throw new BadRequestException('Missing x-workspace-id header');
    }
    
    return workspaceId;
  },
);