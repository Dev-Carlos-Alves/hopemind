/**
 * Synthetic test data shared by unit and integration tests. Nothing here is real personal data.
 */
import { Answers, PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE, sanitizeAnswers } from '../triage/questionnaire';
import { Location, PatientProfile, PsychologistProfile } from '../triage/match/match-engine';

// Neighborhood centres in Recife (the same coordinates the seed uses).
export const GRACAS: Location = { city: 'Recife', neighborhood: 'Graças', latitude: -8.04517, longitude: -34.90077 };
export const ESPINHEIRO: Location = { city: 'Recife', neighborhood: 'Espinheiro', latitude: -8.04287, longitude: -34.89128 };
export const BOA_VIAGEM: Location = { city: 'Recife', neighborhood: 'Boa Viagem', latitude: -8.1235, longitude: -34.9034 };

/** Raw (unsanitized) patient answers, as a client would send them. */
export const rawPatientAnswers = (overrides: Answers = {}): Answers => ({
  P01: ['ansiedade', 'trabalho'],
  P02: ['emocoes'],
  P19: ['ansiedade', 'sono'],
  P03: 5, P05: 4, P06: 2, P07: 5, P08: 2, P09: 5,
  P10: 4, P11: 4, P12: 'profissional_acolhedora', P28: 4, P29: 4, P30: 5,
  P20: 'online', P21: 'semanal', P22: ['ter-noite', 'qui-noite', 'qua-tarde'],
  P23: 'nunca', P26: 'nao', P27: 'nao',
  ...overrides,
});

/** Raw (unsanitized) psychologist answers. */
export const rawPsyAnswers = (overrides: Answers = {}): Answers => ({
  S01: '5-10', S02: ['adultos'], S05: ['tcc'],
  S03: ['ansiedade', 'trabalho', 'sono'], S04: { ansiedade: 5, trabalho: 4, sono: 3 },
  S13: [], S06: 4, S07: 5, S08: 4, S09: 4, S10: 2, S11: 5, S12: 4,
  S19: 3, S20: 4, S21: 5, S14: ['online'], S16: ['ter-noite', 'qui-noite', 'qua-tarde'], S18: 'atende_risco',
  ...overrides,
});

export const patientAnswers = (overrides: Answers = {}) => sanitizeAnswers(PATIENT_QUESTIONNAIRE, rawPatientAnswers(overrides));
export const psyAnswers = (overrides: Answers = {}) => sanitizeAnswers(PSYCHOLOGIST_QUESTIONNAIRE, rawPsyAnswers(overrides));

export const ADULT_BIRTH = new Date('1996-04-10');

export const patientProfile = (
  answers = patientAnswers(),
  safetyLevel: PatientProfile['safetyLevel'] = 'NONE',
  location: Location | null = GRACAS,
): PatientProfile => ({ answers, birthDate: ADULT_BIRTH, safetyLevel, location });

export const psyProfile = (id: number, answers = psyAnswers(), gender = 'Feminino', location: Location | null = ESPINHEIRO): PsychologistProfile => ({
  id,
  answers,
  gender,
  birthDate: new Date('1985-01-01'),
  location,
});

/* ───── deterministic synthetic population (performance and load scenarios) ───── */

const APPROACH_POOL = ['tcc', 'psicanalise', 'humanista', 'act', 'sistemica', 'gestalt'];
const DEMAND_POOL = ['ansiedade', 'trabalho', 'sono', 'humor', 'relacionamentos', 'luto', 'autoestima'];
const SLOT_POOL = ['seg-manha', 'ter-noite', 'qua-tarde', 'qui-noite', 'sex-manha', 'sab-manha'];
const MODALITY_POOL = [['online'], ['presencial'], ['online', 'presencial']];
const NEIGHBORHOODS: Location[] = [GRACAS, ESPINHEIRO, BOA_VIAGEM];

/** Tiny seeded PRNG (mulberry32) so the synthetic population is the same on every run. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds `count` valid psychologist profiles spread across approaches, demands, slots and places. */
export function syntheticPsychologists(count: number, seed = 42): PsychologistProfile[] {
  const rnd = seededRandom(seed);
  const pick = <T>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const some = <T>(list: T[], n: number) => [...list].sort(() => rnd() - 0.5).slice(0, n);
  const scale = () => 1 + Math.floor(rnd() * 5);

  return Array.from({ length: count }, (_, i) => {
    const demands = some(DEMAND_POOL, 3);
    const answers = psyAnswers({
      S05: [pick(APPROACH_POOL)],
      S03: demands,
      S04: Object.fromEntries(demands.map((d) => [d, scale()])),
      S06: scale(), S07: scale(), S08: scale(), S09: scale(), S10: scale(), S11: scale(), S12: scale(),
      S19: scale(), S20: scale(), S21: scale(),
      S14: pick(MODALITY_POOL),
      S16: some(SLOT_POOL, 3),
    });
    return psyProfile(i + 1, answers, rnd() > 0.5 ? 'Feminino' : 'Masculino', pick(NEIGHBORHOODS));
  });
}
