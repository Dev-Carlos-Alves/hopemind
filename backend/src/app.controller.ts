import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

/** Used by Render's health check and by anyone confirming the API is up. */
@Controller('api/health')
export class HealthController {
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  check() {
    return { status: 'ok' };
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
