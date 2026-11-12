import { createTestApp, TestApp } from './test-app';

/**
 * Em produção a API fica atrás do balanceador do Render (e do proxy /api do site), então o IP
 * real do cliente vem em X-Forwarded-For. O limite de tentativas de login precisa ser por cliente.
 */
describe('API — limite de tentativas por cliente atrás de proxy', () => {
  let t: TestApp;

  beforeAll(async () => {
    process.env.TRUST_PROXY = 'true';
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(async () => {
    delete process.env.TRUST_PROXY;
    await t.close();
  });

  const attempt = (ip: string) =>
    t.http().post('/api/auth/login').set('X-Forwarded-For', ip).send({ email: 'x@teste.dev', password: 'errada123' });

  it('erros de senha de um cliente não bloqueiam o login de outro', async () => {
    for (let i = 0; i < 5; i++) await attempt('200.10.0.1').expect(401);
    await attempt('200.10.0.1').expect(429);
    await attempt('189.20.0.2').expect(401); // outro cliente continua podendo tentar
  });
});
