import { createTestApp, loginAs, seedPatient, seedPsychologist, TestApp } from './test-app';

const inDays = (days: number, hour = 19) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

describe('API — agendamento de sessões (US-08 / RN-005)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('paciente agenda e a sessão aparece para ele e para o psicólogo', async () => {
    seedPatient(t.prisma, { email: 'p@teste.dev', name: 'Paciente Um' });
    const { psychologist } = seedPsychologist(t.prisma, { email: 's@teste.dev', name: 'Dra. Sintética' });
    const patient = await loginAs(t, 'p@teste.dev');

    const res = await patient.post('/api/sessoes/agendar').send({ idPsicologo: psychologist.id, dataHora: inDays(3) }).expect(201);
    expect(res.body).toMatchObject({ message: 'Agendado com sucesso', appointmentId: expect.any(Number) });

    const mine = await patient.get('/api/sessoes').expect(200);
    expect(mine.body).toEqual([expect.objectContaining({ psicologoNome: 'Dra. Sintética', pacienteNome: 'Paciente Um', status: 'SCHEDULED', crp: psychologist.crp })]);
    const theirs = await (await loginAs(t, 's@teste.dev')).get('/api/sessoes').expect(200);
    expect(theirs.body).toHaveLength(1);
  });

  it('não expõe sessões de outros pacientes', async () => {
    seedPatient(t.prisma, { email: 'p@teste.dev' });
    seedPatient(t.prisma, { email: 'outro@teste.dev' });
    const { psychologist } = seedPsychologist(t.prisma);
    await (await loginAs(t, 'p@teste.dev')).post('/api/sessoes/agendar').send({ idPsicologo: psychologist.id, dataHora: inDays(3) }).expect(201);
    const other = await (await loginAs(t, 'outro@teste.dev')).get('/api/sessoes').expect(200);
    expect(other.body).toEqual([]);
  });

  it('exige login (401) e perfil de paciente (403)', async () => {
    const { psychologist } = seedPsychologist(t.prisma, { email: 's@teste.dev' });
    const body = { idPsicologo: psychologist.id, dataHora: inDays(3) };
    await t.http().post('/api/sessoes/agendar').send(body).expect(401);
    await t.http().get('/api/sessoes').expect(401);
    await (await loginAs(t, 's@teste.dev')).post('/api/sessoes/agendar').send(body).expect(403);
    expect(t.prisma.tables.appointment).toHaveLength(0);
  });

  it.each([
    ['data no passado', () => ({ dataHora: inDays(-1) })],
    ['data inválida', () => ({ dataHora: 'amanhã às 19h' })],
    ['psicólogo ausente', () => ({ idPsicologo: undefined })],
    ['campo extra', () => ({ valor: 150 })],
  ])('rejeita %s com 400', async (_label, overrides) => {
    seedPatient(t.prisma, { email: 'p@teste.dev' });
    const { psychologist } = seedPsychologist(t.prisma);
    const agent = await loginAs(t, 'p@teste.dev');
    await agent.post('/api/sessoes/agendar').send({ idPsicologo: psychologist.id, dataHora: inDays(3), ...overrides() }).expect(400);
    expect(t.prisma.tables.appointment).toHaveLength(0);
  });

  it('psicólogo inexistente → 404', async () => {
    seedPatient(t.prisma, { email: 'p@teste.dev' });
    await (await loginAs(t, 'p@teste.dev')).post('/api/sessoes/agendar').send({ idPsicologo: 999, dataHora: inDays(3) }).expect(404);
  });

  it('horário já ocupado (sessão de 50 min) → 409', async () => {
    seedPatient(t.prisma, { email: 'a@teste.dev' });
    seedPatient(t.prisma, { email: 'b@teste.dev' });
    const { psychologist } = seedPsychologist(t.prisma);
    const when = inDays(5);
    await (await loginAs(t, 'a@teste.dev')).post('/api/sessoes/agendar').send({ idPsicologo: psychologist.id, dataHora: when }).expect(201);
    const clash = await (await loginAs(t, 'b@teste.dev'))
      .post('/api/sessoes/agendar')
      .send({ idPsicologo: psychologist.id, dataHora: new Date(new Date(when).getTime() + 30 * 60_000).toISOString() })
      .expect(409);
    expect(clash.body.message).toMatch(/já tem uma sessão/);
    // 50 minutos depois o horário já está livre.
    await (await loginAs(t, 'b@teste.dev'))
      .post('/api/sessoes/agendar')
      .send({ idPsicologo: psychologist.id, dataHora: new Date(new Date(when).getTime() + 50 * 60_000).toISOString() })
      .expect(201);
  });
});
