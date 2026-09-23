import { Module } from '@nestjs/common';
import { CepService } from './cep.service';
import { GeoController } from './geo.controller';

@Module({
  controllers: [GeoController],
  providers: [CepService],
  exports: [CepService],
})
export class GeoModule {}
