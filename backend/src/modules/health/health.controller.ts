import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  getHealth() {
    return {
      success: true,
      status: 'ok',
      db: this.prismaService.getStatus(),
      bkashMode: process.env.BKASH_MODE || 'mock',
      supabaseProjectRef: 'fmhbugcullfemxtevpxw',
      timestamp: new Date().toISOString(),
    };
  }
}
