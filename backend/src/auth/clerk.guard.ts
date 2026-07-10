import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
// Ensure you are using the correct Clerk SDK import for your project
import { clerkClient } from '@clerk/clerk-sdk-node'; 

@Injectable()
export class ClerkGuard implements CanActivate {
  private readonly logger = new Logger(ClerkGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.error('No Authorization header found in request');
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Safely extract the token by splitting "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.error('Authorization header is not in "Bearer <token>" format');
      throw new UnauthorizedException('Invalid Authorization format');
    }

    const token = parts[1];

    try {
      this.logger.log('Attempting to verify token with Clerk...');
      
      // We explicitly pass the secret key here to bypass any NestJS environment loading race conditions
      const decodedToken = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      } as any);

      this.logger.log(`Token verified successfully for user: ${decodedToken.sub}`);
      
      // Attach the decoded token payload to the request for your controllers to use
      request.user = decodedToken;
      return true;

    } catch (err: any) {
      // THIS is the crucial part. We need to see exactly why Clerk is failing.
      this.logger.error(`Clerk Verification Failed! Reason: ${err.message}`);
      this.logger.error(`Token snippet: ${token.substring(0, 15)}...`);
      this.logger.error(`Secret Key snippet: ${process.env.CLERK_SECRET_KEY?.substring(0, 15)}...`);
      
      throw new UnauthorizedException(`Invalid or expired token: ${err.message}`);
    }
  }
}