import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const onlyDigits = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits === '' ? undefined : digits;
};

export class LoginDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha.' })
  password: string;
}

export class RegisterDto {
  @IsIn(['PATIENT', 'PSYCHOLOGIST'], { message: 'Perfil inválido.' })
  userType: 'PATIENT' | 'PSYCHOLOGIST';

  @Transform(trim)
  @MaxLength(255, { message: 'Nome muito longo.' })
  @MinLength(3, { message: 'Informe o nome completo.' })
  @IsString({ message: 'Informe o nome completo.' })
  name: string;

  @Transform(trim)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @MaxLength(128, { message: 'Senha muito longa.' })
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres.' })
  @IsString({ message: 'Informe uma senha.' })
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos.' })
  cpf: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve ter DDD + número.' })
  phone: string;

  @IsDateString({}, { message: 'Data de nascimento inválida.' })
  birthDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mainComplaint?: string;

  @ValidateIf((o) => o.userType === 'PSYCHOLOGIST')
  @Transform(trim)
  @Matches(/^CRP\s?\d{2}\/\d{4,6}$/i, { message: 'Informe o CRP no formato CRP 06/123456.' })
  crp?: string;

  @ValidateIf((o) => o.userType === 'PSYCHOLOGIST')
  @Transform(trim)
  @MaxLength(255, { message: 'Especialidade muito longa.' })
  @MinLength(3, { message: 'Informe a especialidade principal.' })
  // class-validator runs the bottom decorator first; with stopAtFirstError it must be the type check.
  @IsString({ message: 'Informe a especialidade principal.' })
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  therapeuticApproach?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  contactLink?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsNumber({}, { message: 'Valor da sessão inválido.' })
  @Min(0)
  sessionFee?: number;

  @IsOptional()
  @Transform(onlyDigits)
  @Matches(/^\d{8}$/, { message: 'CEP deve ter 8 dígitos.' })
  cep?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20, { message: 'Número muito longo.' })
  addressNumber?: string;
}

export class UpdateAddressDto {
  @Transform(onlyDigits)
  @Matches(/^\d{8}$/, { message: 'CEP deve ter 8 dígitos.' })
  cep: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20, { message: 'Número muito longo.' })
  addressNumber?: string;
}
