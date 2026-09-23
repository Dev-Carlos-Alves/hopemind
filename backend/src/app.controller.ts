import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

/** Used by Render's health check and by anyone confirming the API is up. */
@Controller('api/health')
export class AppController {
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  check() {
    return { status: 'ok' };
  }
}
