import { BOA_VIAGEM, rawPatientAnswers, rawPsyAnswers, psyAnswers, patientAnswers } from '../src/testing/fixtures';
import { createTestApp, loginAs, seedPatient, seedPsychologist, TestApp } from './test-app';

describe('API — triagem e matchmaking (integração HTTP)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  describe('questionário (US-04)', () => {
    it('exige login', async () => {
      await t.http().get('/api/triage/questionnaire').expect(401);
      await t.http().post('/api/triage/submissions').send({ answers: {} }).expect(401);
    });

    it('entrega o questionário do perfil logado, versionado', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev' });
      seedPsychologist(t.prisma, { email: 's@teste.dev' });
      const p = await (await loginAs(t, 'p@teste.dev')).get('/api/triage/questionnaire').expect(200);
      const s = await (await loginAs(t, 's@teste.dev')).get('/api/triage/questionnaire').expect(200);
      expect(p.body.audience).toBe('PATIENT');
      expect(s.body.audience).toBe('PSYCHOLOGIST');
      expect(p.body.version).toEqual(expect.any(String));
      expect(p.body.sections.length).toBeGreaterThan(0);
    });

    it('salva respostas válidas em triage_submissions sem alerta', async () => {
      const { user } = seedPatient(t.prisma, { email: 'p@teste.dev', answers: null });
      const agent = await loginAs(t, 'p@teste.dev');
      const res = await agent.post('/api/triage/submissions').send({ answers: rawPatientAnswers() }).expect(201);
      expect(res.body.safety).toEqual({ level: 'NONE', resources: [] });
      expect(t.prisma.tables.triageSubmission).toEqual([expect.objectContaining({ userId: user.id, audience: 'PATIENT', safetyLevel: 'NONE' })]);
      expect(t.prisma.tables.safetyAlert).toHaveLength(0);

      const mine = await agent.get('/api/triage/me').expect(200);
      expect(mine.body.answers.P20).toBe('online');
    });

    it.each([
      ['opção inexistente', { P20: 'teletransporte' }],
      ['mais de 3 prioridades', { P01: ['ansiedade', 'trabalho', 'sono', 'luto'] }],
    ])('rejeita respostas inválidas (%s) com 400', async (_label, overrides) => {
      seedPatient(t.prisma, { email: 'p@teste.dev', answers: null });
      const agent = await loginAs(t, 'p@teste.dev');
      await agent.post('/api/triage/submissions').send({ answers: rawPatientAnswers(overrides) }).expect(400);
      expect(t.prisma.tables.triageSubmission).toHaveLength(0);
    });

    it('rejeita corpo sem o objeto de respostas', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev', answers: null });
      const agent = await loginAs(t, 'p@teste.dev');
      await agent.post('/api/triage/submissions').send({ answers: 'tudo bem' }).expect(400);
    });

    it.each([
      ['ELEVATED', { P26: 'sim', P27: 'nao' }],
      ['IMMEDIATE', { P26: 'sim', P27: 'sim' }],
    ])('risco %s gera alerta de segurança e devolve CVV 188 / SAMU 192 (US-15)', async (level, overrides) => {
      const { patient } = seedPatient(t.prisma, { email: 'p@teste.dev', answers: null });
      const agent = await loginAs(t, 'p@teste.dev');
      const res = await agent.post('/api/triage/submissions').send({ answers: rawPatientAnswers(overrides) }).expect(201);
      expect(res.body.safety.level).toBe(level);
      expect(res.body.safety.resources.map((r: { href?: string }) => r.href)).toEqual(expect.arrayContaining(['tel:188', 'tel:192']));
      expect(t.prisma.tables.safetyAlert).toEqual([expect.objectContaining({ patientId: patient.id, level, status: 'OPEN' })]);
    });

    it('psicólogo responde o questionário profissional sem avaliação de risco', async () => {
      seedPsychologist(t.prisma, { email: 's@teste.dev', answers: null });
      const agent = await loginAs(t, 's@teste.dev');
      const res = await agent.post('/api/triage/submissions').send({ answers: rawPsyAnswers() }).expect(201);
      expect(res.body.safety.level).toBe('NONE');
      expect(t.prisma.tables.triageSubmission[0].audience).toBe('PSYCHOLOGIST');
    });
  });

  describe('recomendações (US-06 / RN-004)', () => {
    it('exige triagem respondida (409) e é exclusivo de pacientes (403)', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev', answers: null });
      seedPsychologist(t.prisma, { email: 's@teste.dev' });
      await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(409);
      await (await loginAs(t, 's@teste.dev')).get('/api/matches').expect(403);
      await t.http().get('/api/matches').expect(401);
    });

    it('aplica filtros, ordena por compatibilidade, explica e registra a execução em match_runs', async () => {
      const { patient } = seedPatient(t.prisma, { email: 'p@teste.dev' });
      const best = seedPsychologist(t.prisma, { name: 'Dra. Compatível' });
      const weaker = seedPsychologist(t.prisma, { answers: psyAnswers({ S06: 1, S07: 1, S08: 1, S11: 1, S12: 1 }) });
      seedPsychologist(t.prisma, { answers: psyAnswers({ S14: ['presencial'] }) }); // modalidade incompatível
      seedPsychologist(t.prisma, { answers: null }); // sem questionário: não entra na avaliação
      seedPsychologist(t.prisma, { isActive: false }); // conta inativa

      const res = await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(200);
      expect(res.body.algorithmVersion).toBe('hm-match-1.1.0');
      expect(res.body.evaluated).toBe(3);
      expect(res.body.excluded).toEqual({ modalidade: 1 });
      expect(res.body.results.map((r: { psychologistId: number }) => r.psychologistId)).toEqual([best.psychologist.id, weaker.psychologist.id]);
      const [top] = res.body.results;
      expect(top.psychologist).toMatchObject({ name: 'Dra. Compatível', crp: best.psychologist.crp, modalities: ['online'] });
      expect(['alta', 'boa', 'possivel']).toContain(top.band);
      expect(top.reasons.length).toBeGreaterThan(0);
      expect(JSON.stringify(res.body)).not.toMatch(/%/);
      expect(t.prisma.tables.matchRun).toEqual([expect.objectContaining({ patientId: patient.id, algorithmVersion: 'hm-match-1.1.0' })]);
    });

    it('informa a distância até o consultório para atendimento presencial', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev', answers: patientAnswers({ P20: 'presencial' }) });
      seedPsychologist(t.prisma, { answers: psyAnswers({ S14: ['presencial'] }) });
      seedPsychologist(t.prisma, { answers: psyAnswers({ S14: ['presencial'] }), location: BOA_VIAGEM });
      const res = await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(200);
      expect(res.body.location).toEqual({ neighborhood: 'Graças', city: 'Recife' });
      const distances = res.body.results.map((r: { distanceKm: number }) => r.distanceKm);
      expect(distances[0]).toBeLessThan(distances[1]);
    });

    it('em caso de risco só recomenda quem atende risco e devolve os contatos de ajuda', async () => {
      seedPatient(t.prisma, { email: 'p@teste.dev', answers: patientAnswers({ P26: 'sim' }), safetyLevel: 'ELEVATED' });
      const atende = seedPsychologist(t.prisma);
      seedPsychologist(t.prisma, { answers: psyAnswers({ S18: 'encaminha_risco' }) });
      const res = await (await loginAs(t, 'p@teste.dev')).get('/api/matches').expect(200);
      expect(res.body.safety.level).toBe('ELEVATED');
      expect(res.body.safety.resources.length).toBeGreaterThan(0);
      expect(res.body.results.map((r: { psychologistId: number }) => r.psychologistId)).toEqual([atende.psychologist.id]);
      expect(res.body.excluded).toEqual({ protocolo_seguranca: 1 });
    });

    it('cada paciente recebe recomendações calculadas com a própria triagem (sem IDOR)', async () => {
      const a = seedPatient(t.prisma, { email: 'a@teste.dev' });
      seedPatient(t.prisma, { email: 'b@teste.dev', answers: patientAnswers({ P20: 'presencial' }) });
      seedPsychologist(t.prisma);
      const res = await (await loginAs(t, 'a@teste.dev')).get('/api/matches').expect(200);
      expect(res.body.modality).toBe('online');
      expect(t.prisma.tables.matchRun[0].patientId).toBe(a.patient.id);
    });
  });
});
