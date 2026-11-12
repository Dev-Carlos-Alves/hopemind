import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
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

export class RefreshDto {
  /** true = "manter conectado" (sessão de 30 dias); false = sessão comum (7 dias). Omitido = mantém a escolha atual. */
  @IsOptional()
  @IsBoolean({ message: 'Informe true ou false em "remember".' })
  remember?: boolean;
}

export class LoginDto {
  /** Permite escolher "manter conectado" já no login (o app também pode escolher depois, em /auth/refresh). */
  @IsOptional()
  @IsBoolean({ message: 'Informe true ou false em "remember".' })
  remember?: boolean;

  /** E-mail ou CPF (com ou sem máscara). */
  @ValidateIf((o) => o.email === undefined)
  @Transform(trim)
  @MaxLength(255)
  @IsNotEmpty({ message: 'Informe o e-mail ou CPF.' })
  @IsString({ message: 'Informe o e-mail ou CPF.' })
  login?: string;

  /** Campo antigo, mantido para clientes que ainda enviam "email"; também aceita CPF. */
  @ValidateIf((o) => o.login === undefined)
  @Transform(trim)
  @MaxLength(255)
  @IsNotEmpty({ message: 'Informe o e-mail ou CPF.' })
  @IsString({ message: 'Informe o e-mail ou CPF.' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha.' })
  password: string;
}

/** "Esqueci minha senha": pede o código de 6 dígitos para o e-mail da conta. */
export class ForgotPasswordDto {
  @Transform(trim)
  @MaxLength(255)
  @IsNotEmpty({ message: 'Informe o e-mail ou CPF.' })
  @IsString({ message: 'Informe o e-mail ou CPF.' })
  login: string;
}

export class ResetPasswordDto {
  @Transform(trim)
  @MaxLength(255)
  @IsNotEmpty({ message: 'Informe o e-mail ou CPF.' })
  @IsString({ message: 'Informe o e-mail ou CPF.' })
  login: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(/^\d{6}$/, { message: 'O código tem 6 dígitos.' })
  code: string;

  @MaxLength(128, { message: 'Senha muito longa.' })
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres.' })
  @IsString({ message: 'Informe a nova senha.' })
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

/** US-11: o psicólogo atualiza o perfil exibido nas recomendações. Campos omitidos não mudam. */
export class UpdateProfessionalProfileDto {
  @IsOptional()
  @Transform(trim)
  @MaxLength(255, { message: 'Especialidade muito longa.' })
  @MinLength(3, { message: 'Informe a especialidade principal.' })
  @IsString({ message: 'Informe a especialidade principal.' })
  specialty?: string;

  @IsOptional()
  @Transform(trim)
  @MaxLength(255, { message: 'Abordagem muito longa.' })
  @MinLength(2, { message: 'Informe a abordagem terapêutica.' })
  @IsString({ message: 'Informe a abordagem terapêutica.' })
  therapeuticApproach?: string;

  /** Texto vazio apaga a biografia. */
  @IsOptional()
  @Transform(trim)
  @MaxLength(2000, { message: 'A biografia pode ter até 2.000 caracteres.' })
  @IsString()
  biography?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @Max(100000, { message: 'Valor da sessão inválido.' })
  @Min(0, { message: 'Valor da sessão inválido.' })
  @IsNumber({}, { message: 'Valor da sessão inválido.' })
  sessionFee?: number;

  /** Link de contato (WhatsApp, site, agenda). Texto vazio apaga o link. */
  @IsOptional()
  @Transform(trim)
  @Matches(/^$|^https?:\/\/\S+$/i, { message: 'Informe um link começando com http:// ou https://.' })
  @MaxLength(500, { message: 'Link muito longo.' })
  @IsString()
  contactLink?: string;
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
