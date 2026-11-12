import { psyAnswers } from '../src/testing/fixtures';
import { createTestApp, loginAs, seedPatient, seedPsychologist, TestApp } from './test-app';

describe('API — edição do perfil profissional (US-11)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('o psicólogo atualiza especialidade, abordagem, biografia, valor e link', async () => {
    const { psychologist } = seedPsychologist(t.prisma, { email: 's@teste.dev' });
    const agent = await loginAs(t, 's@teste.dev');
    const res = await agent
      .patch('/api/auth/me/profile')
      .send({ specialty: ' Ansiedade e estresse ', therapeuticApproach: 'ACT', biography: 'Atendo adultos.', sessionFee: '180', contactLink: 'https://wa.me/5581999990000' })
      .expect(200);
    expect(res.body).toMatchObject({ crp: psychologist.crp, specialty: 'Ansiedade e estresse', therapeuticApproach: 'ACT', biography: 'Atendo adultos.', sessionFee: 180, contactLink: 'https://wa.me/5581999990000' });
    expect(t.prisma.tables.psychologist[0]).toMatchObject({ specialty: 'Ansiedade e estresse', sessionFee: 180 });
  });

  it('campos omitidos não mudam e texto vazio apaga biografia e link', async () => {
    seedPsychologist(t.prisma, { email: 's@teste.dev' });
    t.prisma.tables.psychologist[0].biography = 'Antiga';
    const agent = await loginAs(t, 's@teste.dev');
    await agent.patch('/api/auth/me/profile').send({ biography: '', contactLink: '' }).expect(200);
    expect(t.prisma.tables.psychologist[0]).toMatchObject({ specialty: 'Psicologia clínica', biography: null, contactLink: null });
  });

  it('a alteração aparece nas recomendações do paciente, com o link de contato', async () => {
    seedPatient(t.prisma, { email: 'p@teste.dev' });
    seedPsychologist(t.prisma, { email: 's@teste.dev', answers: psyAnswers() });
    await (await loginAs(t, 's@teste.dev')).patch('/api/auth/me/profile').send({ specialty: 'Terapia para ansiedade', contactLink: 'https://agenda.exemplo.dev/dra' }).expect(200);
    const res = await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(200);
    expect(res.body.results[0].psychologist).toMatchObject({ specialty: 'Terapia para ansiedade', contactLink: 'https://agenda.exemplo.dev/dra' });
  });

  it('é exclusivo de psicólogos (403) e exige login (401)', async () => {
    seedPatient(t.prisma, { email: 'p@teste.dev' });
    await t.http().patch('/api/auth/me/profile').send({ specialty: 'Clínica' }).expect(401);
    await (await loginAs(t, 'p@teste.dev')).patch('/api/auth/me/profile').send({ specialty: 'Clínica' }).expect(403);
  });

  it.each([
    ['link sem http(s)', { contactLink: 'wa.me/5581' }],
    ['link com script', { contactLink: 'javascript:alert(1)' }],
    ['valor negativo', { sessionFee: -10 }],
    ['valor não numérico', { sessionFee: 'caro' }],
    ['especialidade curta', { specialty: 'a' }],
    ['biografia longa demais', { biography: 'x'.repeat(2001) }],
    ['campo não permitido (CRP)', { crp: 'CRP 02/99999' }],
    ['corpo vazio', {}],
  ])('rejeita %s com 400 sem alterar o perfil', async (_label, body) => {
    seedPsychologist(t.prisma, { email: 's@teste.dev' });
    const before = { ...t.prisma.tables.psychologist[0] };
    await (await loginAs(t, 's@teste.dev')).patch('/api/auth/me/profile').send(body).expect(400);
    expect(t.prisma.tables.psychologist[0]).toEqual(before);
  });
});
