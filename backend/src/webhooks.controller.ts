import { Controller, Post, Req, Headers, BadRequestException, Logger } from '@nestjs/common';
import { Webhook } from 'svix';
import { Request } from 'express';
import { PrismaService } from './prisma/prisma.service'; 

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('clerk')
  async handleClerkWebhooks(
    @Req() req: Request & { rawBody: Buffer },
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.error('Missing Svix headers');
      throw new BadRequestException('Missing Svix headers');
    }

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      this.logger.error('Missing CLERK_WEBHOOK_SECRET in .env');
      throw new Error('Server configuration error');
    }

    // Extract the raw body for signature verification
    const payload = req.rawBody.toString('utf8');
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: any;

    try {
      // Cryptographically verify the payload is genuinely from Clerk
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    // Success! The payload is real.
    const eventType = evt.type;
    const { id } = evt.data;
    
    this.logger.log(`✅ Verified Webhook Received: ${eventType} (ID: ${id})`);

    try {
      if (eventType === 'user.created') {
        const email = evt.data.email_addresses?.[0]?.email_address;
        
        await this.prisma.user.upsert({
          where: { id: id },
          update: {}, 
          create: {
            id: id,
            email: email,
            // Add any other fields your Prisma schema requires here
          },
        });
        
        this.logger.log(`Successfully synced User ${id} to PostgreSQL.`);
      } 
      
      else if (eventType === 'organization.created') {
        const orgName = evt.data.name;
        
        await this.prisma.workspace.upsert({
          where: { id: id },
          update: {},
          create: {
            id: id,
            name: orgName,
          },
        });
        
        this.logger.log(`Successfully synced Workspace ${id} to PostgreSQL.`);
      }
    } catch (dbError: any) {
      this.logger.error(`Database sync failed: ${dbError.message}`);
      // Returning a 500 tells Clerk to retry the webhook later
      throw new Error('Failed to sync to database'); 
    }

    // Always return a 200 OK so Clerk knows the event was handled
    return { success: true };
  } 
}