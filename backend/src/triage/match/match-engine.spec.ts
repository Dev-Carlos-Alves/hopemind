import { Answers, PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE, sanitizeAnswers } from '../questionnaire';
import {
  ageGroup,
  computeScore,
  findMatches,
  formatKm,
  hardFilter,
  Location,
  normalizeCity,
  PatientProfile,
  proximity,
  PsychologistProfile,
  scoreComponents,
  similarity,
  WEIGHTS,
} from './match-engine';
import { evaluateSafety } from './safety';

const NOW_ADULT = new Date('1996-04-10');

// Neighborhood centres in Recife (the same coordinates the seed uses).
const GRACAS: Location = { city: 'Recife', neighborhood: 'Graças', latitude: -8.04517, longitude: -34.90077 };
const ESPINHEIRO: Location = { city: 'Recife', neighborhood: 'Espinheiro', latitude: -8.04287, longitude: -34.89128 };
const BOA_VIAGEM: Location = { city: 'Recife', neighborhood: 'Boa Viagem', latitude: -8.1235, longitude: -34.9034 };
const CAMPINAS: Location = { city: 'Campinas', neighborhood: 'Cambuí', latitude: -22.8942, longitude: -47.0514 };

const patientAnswers = (overrides: Answers = {}): Answers =>
  sanitizeAnswers(PATIENT_QUESTIONNAIRE, {
    P01: ['ansiedade', 'trabalho'],
    P02: ['emocoes'],
    P19: ['ansiedade', 'sono'],
    P03: 5, P05: 4, P06: 2, P07: 5, P08: 2, P09: 5,
    P10: 4, P11: 4, P12: 'profissional_acolhedora', P28: 4, P29: 4, P30: 5,
    P20: 'online', P21: 'semanal', P22: ['ter-noite', 'qui-noite', 'qua-tarde'],
    P23: 'nunca', P26: 'nao', P27: 'nao',
    ...overrides,
  });

const psyAnswers = (overrides: Answers = {}): Answers =>
  sanitizeAnswers(PSYCHOLOGIST_QUESTIONNAIRE, {
    S01: '5-10', S02: ['adultos'], S05: ['tcc'],
    S03: ['ansiedade', 'trabalho', 'sono'], S04: { ansiedade: 5, trabalho: 4, sono: 3 },
    S13: [], S06: 4, S07: 5, S08: 4, S09: 4, S10: 2, S11: 5, S12: 4,
    S19: 3, S20: 4, S21: 5, S14: ['online'], S16: ['ter-noite', 'qui-noite', 'qua-tarde'], S18: 'atende_risco',
    ...overrides,
  });

const patient = (
  answers = patientAnswers(),
  safetyLevel: PatientProfile['safetyLevel'] = 'NONE',
  location: Location | null = GRACAS,
): PatientProfile => ({
  answers,
  birthDate: NOW_ADULT,
  safetyLevel,
  location,
});

const psy = (id: number, answers = psyAnswers(), gender = 'Feminino', location: Location | null = ESPINHEIRO): PsychologistProfile => ({
  id,
  answers,
  gender,
  birthDate: new Date('1985-01-01'),
  location,
});

describe('similarity (section 7)', () => {
  it('is 1 for identical answers and 0 for opposite ends', () => {
    expect(similarity(3, 3)).toBe(1);
    expect(similarity(1, 5)).toBe(0);
    expect(similarity(2, 3)).toBe(0.75);
  });
});

describe('weights (section 6)', () => {
  it('sum to 100%', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe('hard filters', () => {
  it('excludes when modality is incompatible', () => {
    expect(hardFilter(patient(), psy(1, psyAnswers({ S14: ['presencial'] })))).toBe('modalidade');
  });

  it('requires the office to be within reach for in-person care', () => {
    const p = patient(patientAnswers({ P20: 'presencial' }));
    expect(hardFilter(p, psy(1, psyAnswers({ S14: ['presencial'] })))).toBeNull();
    expect(hardFilter(p, psy(2, psyAnswers({ S14: ['presencial'] }), 'Feminino', CAMPINAS))).toBe('regiao');
  });

  it('falls back to the same city when an address has no coordinates', () => {
    const p = patient(patientAnswers({ P20: 'presencial' }), 'NONE', { city: 'recife' });
    expect(hardFilter(p, psy(1, psyAnswers({ S14: ['presencial'] })))).toBeNull();
    expect(hardFilter(p, psy(2, psyAnswers({ S14: ['presencial'] }), 'Feminino', { city: 'Olinda' }))).toBe('regiao');
    expect(hardFilter({ ...p, location: null }, psy(3, psyAnswers({ S14: ['presencial'] })))).toBe('regiao');
    expect(normalizeCity('  São  Paulo ')).toBe('sao paulo');
  });

  it('accepts "tanto faz" with an online-only professional', () => {
    const p = patient(patientAnswers({ P20: 'tanto_faz' }), 'NONE', null);
    expect(hardFilter(p, psy(1))).toBeNull();
  });

  it('excludes when the age group is not attended', () => {
    const teen: PatientProfile = { ...patient(), birthDate: new Date(new Date().getFullYear() - 15, 0, 1) };
    expect(ageGroup(teen.birthDate)).toBe('adolescentes');
    expect(hardFilter(teen, psy(1))).toBe('faixa_etaria');
  });

  it('excludes when a priority demand is explicitly not attended', () => {
    expect(hardFilter(patient(), psy(1, psyAnswers({ S13: ['trabalho'] })))).toBe('demanda_nao_atendida');
  });

  it('excludes when there is no common schedule slot', () => {
    expect(hardFilter(patient(), psy(1, psyAnswers({ S16: ['seg-manha'] })))).toBe('sem_horario');
  });

  it('routes risk cases away from professionals who refer them elsewhere', () => {
    const risky = patient(patientAnswers({ P26: 'sim' }), 'ELEVATED');
    expect(hardFilter(risky, psy(1, psyAnswers({ S18: 'encaminha_risco' })))).toBe('protocolo_seguranca');
    expect(hardFilter(risky, psy(2))).toBeNull();
  });
});

describe('safety flow (section 1)', () => {
  it('classifies risk answers without touching the score', () => {
    expect(evaluateSafety(patientAnswers())).toBe('NONE');
    expect(evaluateSafety(patientAnswers({ P26: 'conversar' }))).toBe('WANTS_TALK');
    expect(evaluateSafety(patientAnswers({ P26: 'sim' }))).toBe('ELEVATED');
    expect(evaluateSafety(patientAnswers({ P27: 'nao_sei' }))).toBe('ELEVATED');
    expect(evaluateSafety(patientAnswers({ P27: 'sim' }))).toBe('IMMEDIATE');

    const calm = scoreComponents(patient(), psy(1)).components;
    const risky = scoreComponents(patient(patientAnswers({ P26: 'sim' }), 'ELEVATED'), psy(1)).components;
    expect(computeScore(risky)).toBe(computeScore(calm));
  });
});

describe('components', () => {
  it('gives full demand score when every demand is covered', () => {
    expect(scoreComponents(patient(), psy(1)).components.demanda).toBe(1);
  });

  it('weights priority demands (P01) twice as much as topics of interest (P19)', () => {
    const missingPriority = psy(1, psyAnswers({ S03: ['ansiedade', 'sono'], S04: { ansiedade: 5, sono: 3 } }));
    const missingTopic = psy(2, psyAnswers({ S03: ['ansiedade', 'trabalho'], S04: { ansiedade: 5, trabalho: 4 } }));
    // demands: ansiedade (2), trabalho (2), sono (1) -> total 5
    expect(scoreComponents(patient(), missingPriority).components.demanda).toBeCloseTo(3 / 5);
    expect(scoreComponents(patient(), missingTopic).components.demanda).toBeCloseTo(4 / 5);
  });

  it('treats "conversar livremente" (P06) as the inverse of structure (S06)', () => {
    const likesFree = patient(patientAnswers({ P06: 5, P05: null, P07: null, P08: null, P09: null, P11: 3, P10: 3 }));
    const structured = psy(1, psyAnswers({ S06: 5, S08: 3, S12: 3 }));
    const free = psy(2, psyAnswers({ S06: 1, S08: 3, S12: 3 }));
    expect(scoreComponents(likesFree, free).components.estilo).toBeGreaterThan(
      scoreComponents(likesFree, structured).components.estilo,
    );
  });

  it('only scores personal preferences when the patient states one', () => {
    expect(scoreComponents(patient(), psy(1)).components.preferencias).toBe(1);
    const wantsMan = patient(patientAnswers({ P17: 'homem' }));
    expect(scoreComponents(wantsMan, psy(1, psyAnswers(), 'Feminino')).components.preferencias).toBe(0);
    expect(scoreComponents(wantsMan, psy(2, psyAnswers(), 'Masculino')).components.preferencias).toBe(1);
  });
});

describe('distance (localizacao)', () => {
  const inPerson = () => psyAnswers({ S14: ['presencial'] });

  it('scores a nearby office higher than a distant one for in-person patients', () => {
    const p = patient(patientAnswers({ P20: 'presencial' }));
    const near = scoreComponents(p, psy(1, inPerson(), 'Feminino', ESPINHEIRO));
    const far = scoreComponents(p, psy(2, inPerson(), 'Feminino', BOA_VIAGEM));
    expect(near.distanceKm).toBeCloseTo(1.1, 1);
    expect(far.distanceKm).toBeGreaterThan(8);
    expect(near.components.localizacao).toBe(1);
    expect(far.components.localizacao).toBeLessThan(0.6);
  });

  it('ignores distance for online patients but still reports it', () => {
    const r = scoreComponents(patient(), psy(1, psyAnswers(), 'Feminino', BOA_VIAGEM));
    expect(r.components.localizacao).toBe(1);
    expect(r.distanceKm).toBeGreaterThan(8);
  });

  it('prefers a close office over online-only when the patient accepts both', () => {
    const p = patient(patientAnswers({ P20: 'tanto_faz' }));
    const hybridNear = scoreComponents(p, psy(1, psyAnswers({ S14: ['online', 'presencial'] }))).components.localizacao;
    const onlineOnly = scoreComponents(p, psy(2)).components.localizacao;
    expect(hybridNear).toBe(1);
    expect(onlineOnly).toBe(0.8);
  });

  it('decays proximity linearly and formats distances in Portuguese', () => {
    expect(proximity(1)).toBe(1);
    expect(proximity(12)).toBeCloseTo(0.3);
    expect(proximity(40)).toBe(0.3);
    expect(proximity(null)).toBe(0.6);
    expect(formatKm(0.4)).toBe('menos de 1 km');
    expect(formatKm(3.25)).toBe('3,3 km');
  });

  it('explains where the office is', () => {
    const p = patient(patientAnswers({ P20: 'presencial' }));
    const { results } = findMatches(p, [psy(1, inPerson())]);
    expect(results[0].reasons).toContain('Consultório em Espinheiro, a 1,1 km de você');
  });
});

describe('findMatches (section 8)', () => {
  it('ranks by score, counts exclusions and explains every result', () => {
    const close = psy(1);
    const far = psy(2, psyAnswers({ S03: ['luto'], S04: { luto: 5 }, S06: 1, S07: 1, S08: 1, S09: 1, S11: 1, S21: 1 }));
    const excluded = psy(3, psyAnswers({ S14: ['presencial'] }));

    const { results, excluded: why } = findMatches(patient(), [far, excluded, close]);

    expect(results.map((r) => r.psychologistId)).toEqual([1, 2]);
    expect(why).toEqual({ modalidade: 1 });
    expect(results[0].band).toBe('alta');
    expect(results[0].reasons[0]).toMatch(/Experiência declarada em ansiedade e trabalho/);
    expect(results[1].considerations).toContain('Sem experiência declarada nas suas demandas prioritárias');
  });
});

describe('sanitizeAnswers', () => {
  it('rejects values outside the option list', () => {
    expect(() => patientAnswers({ P20: 'teletransporte' })).toThrow(/P20/);
  });

  it('enforces the 3-priority limit on P01', () => {
    expect(() => patientAnswers({ P01: ['ansiedade', 'trabalho', 'sono', 'luto'] })).toThrow(/no máximo 3/);
  });

  it('drops answers to questions that are not in the questionnaire (e.g. the old city field)', () => {
    expect(patientAnswers({ P20: 'presencial', P20A: 'Recife' }).P20A).toBeUndefined();
  });

  it('keeps "sem preferência" exclusive', () => {
    expect(patientAnswers({ P18: ['sem_preferencia', 'mais_jovem'] }).P18).toEqual(['sem_preferencia']);
  });

  it('requires an experience level for each demand selected in S03', () => {
    expect(() => psyAnswers({ S03: ['ansiedade', 'luto'], S04: { ansiedade: 4 } })).toThrow(/S04/);
    expect(psyAnswers({ S03: ['luto'], S04: { luto: 2, ansiedade: 5 } }).S04).toEqual({ luto: 2 });
  });
});
