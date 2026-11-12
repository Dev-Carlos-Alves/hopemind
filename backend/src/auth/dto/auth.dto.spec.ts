import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from '../../appointments/dto/create-appointment.dto';
import { LoginDto, RegisterDto, UpdateAddressDto } from './auth.dto';

/** Same options as the global ValidationPipe (app.setup.ts). */
async function check<T extends object>(cls: new () => T, body: Record<string, unknown>) {
  const instance = plainToInstance(cls, body);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true, stopAtFirstError: true });
  return { instance, fields: errors.map((e) => e.property) };
}

const patient = (overrides: Record<string, unknown> = {}) => ({
  userType: 'PATIENT',
  name: 'Paciente Sintético',
  email: 'paciente@teste.dev',
  password: 'SenhaForte123',
  cpf: '529.982.247-25',
  phone: '(81) 99999-0000',
  birthDate: '1996-04-10',
  ...overrides,
});

const psychologist = (overrides: Record<string, unknown> = {}) =>
  patient({ userType: 'PSYCHOLOGIST', crp: 'CRP 02/12345', specialty: 'Psicologia clínica', ...overrides });

describe('RegisterDto — cadastro (US-01 / US-03)', () => {
  it('aceita um paciente válido e normaliza CPF e telefone para dígitos', async () => {
    const { instance, fields } = await check(RegisterDto, patient());
    expect(fields).toEqual([]);
    expect(instance.cpf).toBe('52998224725');
    expect(instance.phone).toBe('81999990000');
  });

  it.each(['CRP 02/12345', 'CRP 06/123456', 'crp 02/1234', 'CRP02/12345'])('aceita o CRP %s (RN-001)', async (crp) => {
    expect((await check(RegisterDto, psychologist({ crp }))).fields).toEqual([]);
  });

  it.each(['123/45678', '02/12345', '02-12345', 'CRP 02/123', 'CRP 2/12345', 'CRP 02/1234567', '', "CRP 02/12345' OR 1=1 --"])(
    'rejeita o CRP inválido "%s"',
    async (crp) => {
      expect((await check(RegisterDto, psychologist({ crp }))).fields).toContain('crp');
    },
  );

  it('exige CRP e especialidade apenas de psicólogos', async () => {
    expect((await check(RegisterDto, patient())).fields).not.toContain('crp');
    expect((await check(RegisterDto, psychologist({ crp: undefined }))).fields).toContain('crp');
    expect((await check(RegisterDto, psychologist({ specialty: undefined }))).fields).toContain('specialty');
  });

  it.each([
    ['email', 'nao-e-email'],
    ['email', "' OR 1=1 --"],
    ['password', 'curta'],
    ['cpf', '123'],
    ['phone', '9999'],
    ['birthDate', 'ontem'],
    ['name', ''],
    ['userType', 'ADMIN'],
    ['cep', '5000'],
  ])('rejeita %s inválido (%s)', async (field, value) => {
    expect((await check(RegisterDto, patient({ [field]: value }))).fields).toContain(field);
  });

  it('rejeita campos não permitidos (forbidNonWhitelisted)', async () => {
    expect((await check(RegisterDto, patient({ isAdmin: true }))).fields).toContain('isAdmin');
  });

  it('não interpreta HTML: um nome com <script> é só texto e não pode virar campo extra', async () => {
    const { instance, fields } = await check(RegisterDto, patient({ name: '<script>alert(1)</script>' }));
    expect(fields).toEqual([]);
    expect(instance.name).toBe('<script>alert(1)</script>');
  });
});

describe('LoginDto, UpdateAddressDto e CreateAppointmentDto', () => {
  it('login exige e-mail válido e senha', async () => {
    expect((await check(LoginDto, { email: ' a@b.dev ', password: 'x' })).fields).toEqual([]);
    expect((await check(LoginDto, { email: 'a@b.dev', password: '' })).fields).toEqual(['password']);
  });

  it('CEP aceita máscara e exige 8 dígitos', async () => {
    const ok = await check(UpdateAddressDto, { cep: '52050-000' });
    expect(ok.fields).toEqual([]);
    expect(ok.instance.cep).toBe('52050000');
    expect((await check(UpdateAddressDto, { cep: '5205' })).fields).toEqual(['cep']);
  });

  it('agendamento exige psicólogo e data/hora válidos', async () => {
    expect((await check(CreateAppointmentDto, { idPsicologo: '3', dataHora: '2030-01-10T19:00:00.000Z' })).fields).toEqual([]);
    expect((await check(CreateAppointmentDto, { idPsicologo: 0, dataHora: '2030-01-10T19:00:00.000Z' })).fields).toEqual(['idPsicologo']);
    expect((await check(CreateAppointmentDto, { idPsicologo: 3, dataHora: 'amanhã' })).fields).toEqual(['dataHora']);
  });
});
