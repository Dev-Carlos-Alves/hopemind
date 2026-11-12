import { Controller, Get, Redirect, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /** Used by Render's health check and by anyone confirming the API is up (does not touch the database). */
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  check() {
    return { status: 'ok' };
  }

  /**
   * Checks the database too. Called by the scheduled "keep-alive" workflow: the Supabase free
   * plan pauses a project after a week without activity, which took the API down on 11/11/2026.
   */
  @Public()
  @Get('db')
  @ApiExcludeEndpoint()
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' });
    }
  }
}

/**
 * This is an API, not a website — there's nothing to show at "/". Whoever opens the bare
 * domain in a browser (which is expected: it's what Render, and now you, tried first) gets
 * sent to the interactive docs instead of a bare 404.
 */
@Controller()
export class AppController {
  @Public()
  @Get()
  @Redirect('/api/docs')
  @ApiExcludeEndpoint()
  root() {}
}
