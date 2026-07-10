import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Get the database URL from your .env file
    const connectionString = process.env.DATABASE_URL;
    
    // 2. Create a connection pool
    const pool = new Pool({ connectionString });
    
    // 3. Pass the pool to the new Prisma 7 adapter
    const adapter = new PrismaPg(pool);
    
    // 4. Initialize the Prisma Client with the adapter
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}