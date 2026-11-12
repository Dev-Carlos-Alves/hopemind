import { psyAnswers, patientAnswers } from '../src/testing/fixtures';
import { createTestApp, loginAs, PASSWORD, seedPatient, seedPsychologist, TestApp } from './test-app';

const maskCpf = (d: string) => `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;

describe('API — acesso por e-mail ou CPF, esqueci minha senha e perfis detalhados', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  describe('login por e-mail ou CPF', () => {
    it.each([
      ['e-mail no campo login', (u: { email: string; cpf: string }) => ({ login: u.email.toUpperCase() })],
      ['CPF só com números', (u: { email: string; cpf: string }) => ({ login: u.cpf })],
      ['CPF com máscara', (u: { email: string; cpf: string }) => ({ login: maskCpf(u.cpf) })],
      ['CPF no campo antigo "email"', (u: { email: string; cpf: string }) => ({ email: u.cpf })],
    ])('entra com %s', async (_label, body) => {
      const { user } = seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const res = await t.http().post('/api/auth/login').send({ ...body(user as never), password: PASSWORD }).expect(200);
      expect(res.body.user.id).toBe(user.id);
    });

    it('identificador desconhecido ou incompleto → 401 com mensagem genérica', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      for (const login of ['ninguem@teste.dev', '123.456', '00000000000']) {
        const res = await t.http().post('/api/auth/login').send({ login, password: PASSWORD }).expect(401);
        expect(res.body.message).toBe('E-mail, CPF ou senha incorretos.');
      }
      t.reset();
    });

    it('exige e-mail ou CPF (400)', async () => {
      await t.http().post('/api/auth/login').send({ password: PASSWORD }).expect(400);
    });
  });

  describe('esqueci minha senha', () => {
    const codeFrom = (text: string) => /(\d{6})/.exec(text)![1];

    it('envia um código por e-mail e permite trocar a senha com ele (uma única vez)', async () => {
      const { user } = seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const res = await t.http().post('/api/auth/forgot-password').send({ login: maskCpf(user.cpf) }).expect(200);
      expect(res.body.message).toMatch(/Se houver uma conta/);
      expect(t.mail.sent).toHaveLength(1);
      expect(t.mail.sent[0].to).toBe('ana@teste.dev');
      const code = codeFrom(t.mail.sent[0].text);
      expect(t.prisma.tables.passwordReset[0].codeHash).not.toContain(code); // só o hash fica salvo

      await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code, password: 'NovaSenha2026' }).expect(200);
      await t.http().post('/api/auth/login').send({ login: 'ana@teste.dev', password: PASSWORD }).expect(401);
      await t.http().post('/api/auth/login').send({ login: 'ana@teste.dev', password: 'NovaSenha2026' }).expect(200);
      // O mesmo código não serve de novo.
      await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code, password: 'OutraSenha2026' }).expect(400);
    });

    it('responde igual quando a conta não existe e não envia nada', async () => {
      const res = await t.http().post('/api/auth/forgot-password').send({ login: 'ninguem@teste.dev' }).expect(200);
      expect(res.body.message).toMatch(/Se houver uma conta/);
      expect(t.mail.sent).toHaveLength(0);
    });

    it('um novo pedido invalida o código anterior', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      await t.http().post('/api/auth/forgot-password').send({ login: 'ana@teste.dev' }).expect(200);
      const first = codeFrom(t.mail.sent[0].text);
      await t.http().post('/api/auth/forgot-password').send({ login: 'ana@teste.dev' }).expect(200);
      const second = codeFrom(t.mail.sent[1].text);
      if (first !== second) {
        await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code: first, password: 'NovaSenha2026' }).expect(400);
      }
      await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code: second, password: 'NovaSenha2026' }).expect(200);
    });

    it('bloqueia o código depois de 5 tentativas erradas', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      await t.http().post('/api/auth/forgot-password').send({ login: 'ana@teste.dev' }).expect(200);
      const code = codeFrom(t.mail.sent[0].text);
      const wrong = code === '000000' ? '111111' : '000000';
      for (let i = 0; i < 4; i++) {
        await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code: wrong, password: 'NovaSenha2026' }).expect(400);
      }
      const storage = t.prisma.tables.passwordReset[0];
      storage.attempts = 5;
      await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code, password: 'NovaSenha2026' }).expect(400);
    });

    it('recusa código expirado', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      await t.http().post('/api/auth/forgot-password').send({ login: 'ana@teste.dev' }).expect(200);
      const code = codeFrom(t.mail.sent[0].text);
      t.prisma.tables.passwordReset[0].expiresAt = new Date(Date.now() - 1000);
      await t.http().post('/api/auth/reset-password').send({ login: 'ana@teste.dev', code, password: 'NovaSenha2026' }).expect(400);
    });

    it.each([
      ['código com 5 dígitos', { code: '12345' }],
      ['senha curta', { password: '123' }],
      ['sem identificador', { login: '' }],
    ])('valida o pedido (%s → 400)', async (_label, override) => {
      await t.http()
        .post('/api/auth/reset-password')
        .send({ login: 'ana@teste.dev', code: '123456', password: 'NovaSenha2026', ...override })
        .expect(400);
    });
  });

  describe('perfis detalhados', () => {
    it('o card do match traz o perfil completo do psicólogo', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev' });
      seedPsychologist(t.prisma, { answers: psyAnswers({ S01: '5-10', S02: ['adultos'], S17: ['reservado', 'objetivos'] }) });
      t.prisma.tables.psychologist[0].biography = 'Atendo adultos com ansiedade.';
      const res = await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(200);
      const p = res.body.results[0].psychologist;
      expect(p).toMatchObject({ therapeuticApproach: 'TCC', gender: 'Feminino', biography: 'Atendo adultos com ansiedade.' });
      expect(typeof p.experience).toBe('string');
      expect(p.audiences.length).toBeGreaterThan(0);
      expect(p.demands.length).toBeGreaterThan(0);
      expect(p.experiencedWith).toEqual(['Mais reservado', 'Orientado a objetivos']);
    });

    it('o psicólogo vê o perfil de quem agendou com ele; o paciente vê o do psicólogo', async () => {
      const { patient } = seedPatient(t.prisma, { email: 'p@teste.dev', name: 'Paciente Um', answers: patientAnswers({ P01: ['ansiedade', 'trabalho'] }) });
      t.prisma.tables.patient[0].mainComplaint = 'Ando muito ansiosa com o trabalho.';
      const { psychologist } = seedPsychologist(t.prisma, { email: 's@teste.dev', name: 'Dra. Sintética' });
      t.prisma.insert('appointment', { patientId: patient.id, psychologistId: psychologist.id, appointmentDate: new Date(Date.now() + 86400000) });

      const forPsy = await (await loginAs(t, 's@teste.dev')).get('/api/sessoes').expect(200);
      expect(forPsy.body[0].paciente).toMatchObject({ nome: 'Paciente Um', sobre: 'Ando muito ansiosa com o trabalho.', bairro: 'Graças' });
      expect(forPsy.body[0].paciente.idade).toBeGreaterThan(18);
      expect(forPsy.body[0].paciente.prioridades.length).toBe(2);
      expect(forPsy.body[0].psicologo).toBeUndefined();
      expect(JSON.stringify(forPsy.body)).not.toMatch(/passwordHash|cpf/);

      const forPatient = await (await loginAs(t, 'p@teste.dev')).get('/api/sessoes').expect(200);
      expect(forPatient.body[0].psicologo).toMatchObject({ nome: 'Dra. Sintética', crp: psychologist.crp, abordagem: 'TCC' });
      expect(forPatient.body[0].paciente).toBeUndefined();
    });
  });
});
