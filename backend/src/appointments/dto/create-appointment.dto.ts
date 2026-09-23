import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateAppointmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPsicologo: number;

  @IsDateString({}, { message: 'Data e hora inválidas.' })
  dataHora: string;
}
