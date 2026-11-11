import { JwtService } from '@nestjs/jwt';
import { cookiesOf, createTestApp, loginAs, PASSWORD, seedPatient, TestApp } from './test-app';

const newPatient = (overrides: Record<string, unknown> = {}) => ({
  userType: 'PATIENT',
  name: 'Paciente Sintético',
  email: 'novo@teste.dev',
  password: PASSWORD,
  cpf: '529.982.247-25',
  phone: '(81) 99999-0000',
  birthDate: '1996-04-10',
  ...overrides,
});

describe('API — autenticação, segurança e escopo (integração HTTP)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  describe('infraestrutura', () => {
    it('GET /api/health responde 200 (health check do Render e smoke test)', async () => {
      await t.http().get('/api/health').expect(200, { status: 'ok' });
    });

    it('a raiz redireciona para a documentação Swagger', async () => {
      const res = await t.http().get('/').expect(302);
      expect(res.headers.location).toBe('/api/docs');
    });

    it('envia os cabeçalhos de segurança do Helmet', async () => {
      const res = await t.http().get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('CORS aceita a origem configurada, com credenciais, e ignora origens desconhecidas', async () => {
      const ok = await t.http().get('/api/health').set('Origin', 'http://localhost:5173');
      expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(ok.headers['access-control-allow-credentials']).toBe('true');
      const evil = await t.http().get('/api/health').set('Origin', 'https://site-malicioso.example');
      expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    });

    it.each(['/api/chat', '/api/payments', '/api/telemedicine'])('%s não existe (fora do escopo da V1.5) → 404', async (path) => {
      await t.http().get(path).expect(404);
      await t.http().post(path).send({}).expect(404);
    });
  });

  describe('cadastro (US-01 / US-03)', () => {
    it('cadastra paciente e grava a senha só como hash bcrypt', async () => {
      const res = await t.http().post('/api/auth/register').send(newPatient()).expect(201);
      expect(res.body.userId).toBeDefined();
      const [user] = t.prisma.tables.user;
      expect(user.email).toBe('novo@teste.dev');
      expect(user.cpf).toBe('52998224725');
      expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
      expect(user.passwordHash).not.toContain(PASSWORD);
      expect(t.prisma.tables.patient).toHaveLength(1);
    });

    it('cadastra psicólogo com CRP normalizado e perfil profissional', async () => {
      await t.http()
        .post('/api/auth/register')
        .send(newPatient({ userType: 'PSYCHOLOGIST', crp: 'crp 02/12345', specialty: 'Psicologia clínica', sessionFee: '150' }))
        .expect(201);
      expect(t.prisma.tables.psychologist[0]).toMatchObject({ crp: 'CRP 02/12345', specialty: 'Psicologia clínica', sessionFee: 150 });
    });

    it('resolve o endereço pelo CEP no servidor', async () => {
      await t.http().post('/api/auth/register').send(newPatient({ cep: '52050-000', addressNumber: '100' })).expect(201);
      expect(t.prisma.tables.user[0]).toMatchObject({ cep: '52050-000', neighborhood: 'Graças', city: 'Recife', latitude: -8.04517 });
    });

    it('rejeita e-mail ou CPF repetidos (400)', async () => {
      await t.http().post('/api/auth/register').send(newPatient()).expect(201);
      const dupEmail = await t.http().post('/api/auth/register').send(newPatient({ cpf: '11144477735', email: 'NOVO@teste.dev' })).expect(400);
      expect(dupEmail.body.message).toMatch(/já cadastrados/);
      await t.http().post('/api/auth/register').send(newPatient({ email: 'outro@teste.dev' })).expect(400);
      expect(t.prisma.tables.user).toHaveLength(1);
    });

    it('rejeita CRP repetido (400)', async () => {
      const psy = (email: string, cpf: string) => newPatient({ userType: 'PSYCHOLOGIST', email, cpf, crp: 'CRP 02/12345', specialty: 'Clínica' });
      await t.http().post('/api/auth/register').send(psy('a@teste.dev', '52998224725')).expect(201);
      const res = await t.http().post('/api/auth/register').send(psy('b@teste.dev', '11144477735')).expect(400);
      expect(res.body.message).toMatch(/CRP já está cadastrado/);
    });

    it.each([
      ['CRP inválido', { userType: 'PSYCHOLOGIST', crp: '02-12345', specialty: 'Clínica' }],
      ['campo não permitido', { isAdmin: true }],
      ['perfil ADMIN', { userType: 'ADMIN' }],
      ['SQL Injection no e-mail', { email: "' OR 1=1 --" }],
      ['senha curta', { password: '123' }],
      ['CEP incompleto', { cep: '5205' }],
    ])('rejeita %s com 400 e não grava nada', async (_label, overrides) => {
      await t.http().post('/api/auth/register').send(newPatient(overrides)).expect(400);
      expect(t.prisma.tables.user).toHaveLength(0);
    });

    it('CEP desconhecido no cadastro → 404, sem criar o usuário', async () => {
      await t.http().post('/api/auth/register').send(newPatient({ cep: '00000-000' })).expect(404);
      expect(t.prisma.tables.user).toHaveLength(0);
    });
  });

  describe('login e sessão (US-02 / RNF-004)', () => {
    it('login grava os tokens apenas em cookies httpOnly e não devolve a senha', async () => {
      const { user } = seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const res = await t.http().post('/api/auth/login').send({ email: 'ANA@teste.dev ', password: PASSWORD }).expect(200);
      const cookies = cookiesOf(res);
      expect(cookies.find((c) => c.startsWith('access_token='))).toMatch(/HttpOnly/);
      expect(cookies.find((c) => c.startsWith('refresh_token='))).toMatch(/HttpOnly/);
      expect(cookies.join(';')).toMatch(/SameSite=Lax/);
      expect(res.body.user).toMatchObject({ id: user.id, userType: 'PATIENT', hasTriage: true });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|accessToken|refreshToken|\$2[aby]\$/);
    });

    it('credenciais inválidas → 401 com mensagem genérica', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const wrong = await t.http().post('/api/auth/login').send({ email: 'ana@teste.dev', password: 'errada123' }).expect(401);
      const unknown = await t.http().post('/api/auth/login').send({ email: 'ninguem@teste.dev', password: 'errada123' }).expect(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('conta inativa não consegue entrar', async () => {
      seedPatient(t.prisma, { email: 'inativa@teste.dev', isActive: false });
      await t.http().post('/api/auth/login').send({ email: 'inativa@teste.dev', password: PASSWORD }).expect(401);
    });

    it('limita tentativas de login (5 por minuto) → 429', async () => {
      for (let i = 0; i < 5; i++) await t.http().post('/api/auth/login').send({ email: 'x@teste.dev', password: 'errada123' }).expect(401);
      await t.http().post('/api/auth/login').send({ email: 'x@teste.dev', password: 'errada123' }).expect(429);
    });

    it('GET /api/auth/me exige autenticação e nunca expõe o hash', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      await t.http().get('/api/auth/me').expect(401);
      const agent = await loginAs(t, 'ana@teste.dev');
      const me = await agent.get('/api/auth/me').expect(200);
      expect(me.body).toMatchObject({ email: 'ana@teste.dev', userType: 'PATIENT', city: 'Recife', hasTriage: true });
      expect(me.body.passwordHash).toBeUndefined();
      expect(me.body.cpf).toBeUndefined();
    });

    it('rejeita token adulterado, assinado com outro segredo ou expirado', async () => {
      const { user } = seedPatient(t.prisma);
      const jwt = new JwtService();
      const payload = { sub: user.id, email: user.email, name: user.name, userType: 'PATIENT', patientId: 1, psychologistId: null };
      const forged = await jwt.signAsync(payload, { secret: 'segredo-errado' });
      const expired = await jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: -10 });
      const valid = await jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET });
      const tampered = valid.slice(0, -3) + (valid.endsWith('a') ? 'bbb' : 'aaa');
      for (const token of [forged, expired, tampered, 'lixo']) {
        await t.http().get('/api/auth/me').set('Cookie', `access_token=${token}`).expect(401);
      }
      await t.http().get('/api/auth/me').set('Cookie', `access_token=${valid}`).expect(200);
    });

    it('renova a sessão com o refresh token e recusa sem ele', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const agent = await loginAs(t, 'ana@teste.dev');
      const res = await agent.post('/api/auth/refresh').expect(200);
      expect(cookiesOf(res).some((c) => c.startsWith('access_token='))).toBe(true);
      await t.http().post('/api/auth/refresh').expect(401);
    });

    it('o refresh token não serve como token de acesso', async () => {
      seedPatient(t.prisma, { email: 'ana@teste.dev' });
      const res = await t.http().post('/api/auth/login').send({ email: 'ana@teste.dev', password: PASSWORD });
      const refresh = cookiesOf(res).find((c) => c.startsWith('refresh_token='))!.split(';')[0].split('=')[1];
      await t.http().get('/api/auth/me').set('Cookie', `access_token=${refresh}`).expect(401);
    });

    it('logout limpa os cookies', async () => {
      const res = await t.http().post('/api/auth/logout').expect(200);
      const cookies = cookiesOf(res);
      expect(cookies.find((c) => c.startsWith('access_token=;'))).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(cookies.find((c) => c.startsWith('refresh_token=;'))).toBeDefined();
    });
  });

  describe('endereço e CEP (US-14 / RF-008)', () => {
    it('GET /api/geo/cep/:cep é público e devolve endereço com coordenadas', async () => {
      const res = await t.http().get('/api/geo/cep/52050000').expect(200);
      expect(res.body).toMatchObject({ city: 'Recife', neighborhood: 'Graças', precision: 'bairro' });
    });

    it('CEP inexistente → 404 e malformado → 400', async () => {
      await t.http().get('/api/geo/cep/00000000').expect(404);
      await t.http().get('/api/geo/cep/123').expect(400);
    });

    it('PATCH /api/auth/me/address atualiza apenas o endereço do próprio usuário', async () => {
      const { user } = seedPatient(t.prisma, { email: 'ana@teste.dev', location: null });
      const other = seedPatient(t.prisma, { email: 'bia@teste.dev', location: null });
      const agent = await loginAs(t, 'ana@teste.dev');
      await t.http().patch('/api/auth/me/address').send({ cep: '52050-000' }).expect(401);
      const res = await agent.patch('/api/auth/me/address').send({ cep: '52050-000', addressNumber: '42' }).expect(200);
      expect(res.body).toMatchObject({ cep: '52050-000', addressNumber: '42', city: 'Recife' });
      expect(t.prisma.tables.user.find((u) => u.id === user.id)!.latitude).toBe(-8.04517);
      expect(t.prisma.tables.user.find((u) => u.id === other.user.id)!.cep).toBeNull();
    });
  });
});
