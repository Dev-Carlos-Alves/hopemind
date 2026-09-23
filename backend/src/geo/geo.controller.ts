import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CepService } from './cep.service';

@ApiTags('Geo')
@Controller('api/geo')
export class GeoController {
  constructor(private cepService: CepService) {}

  // Public because the sign-up form fills the address from the CEP before there is a session.
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('cep/:cep')
  @ApiOperation({ summary: 'Endereço e coordenadas (nível de bairro) a partir do CEP' })
  lookup(@Param('cep') cep: string) {
    return this.cepService.lookup(cep);
  }
}
