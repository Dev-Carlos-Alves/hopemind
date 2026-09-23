import { distanceKm, hasCoords } from '../../geo/distance';
import { DEMANDS, labelOf } from '../questionnaire/catalog';
import { Answers } from '../questionnaire';
import { isRiskLevel, SafetyLevelCode } from './safety';

/**
 * Deterministic, explainable matching — sections 2, 6, 7 and 8 of
 * "HopeMind_Formularios_e_Algoritmo_de_Match". Weights are prototype parameters
 * (not validated science) and must be revisited with the clinical team.
 *
 * 1.1.0: location comes from the CEP on the profile, and the distance to the office
 * is part of the score (component "localizacao").
 */
export const ALGORITHM_VERSION = 'hm-match-1.1.0';

export const WEIGHTS = {
  demanda: 0.25,
  estilo: 0.18,
  experiencia: 0.14,
  relacao: 0.13,
  disponibilidade: 0.1,
  // Modalidade + distância até o consultório.
  localizacao: 0.15,
  preferencias: 0.05,
} as const;

export type Component = keyof typeof WEIGHTS;
export type AgeGroup = 'criancas' | 'adolescentes' | 'adultos' | 'idosos';

export type ExclusionReason = 'modalidade' | 'regiao' | 'faixa_etaria' | 'demanda_nao_atendida' | 'sem_horario' | 'protocolo_seguranca';

/** Address resolved from the CEP on the user's profile. */
export interface Location {
  city?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PatientProfile {
  answers: Answers;
  birthDate: Date;
  safetyLevel: SafetyLevelCode;
  location?: Location | null;
}

export interface PsychologistProfile {
  id: number;
  answers: Answers;
  gender: string;
  birthDate: Date;
  location?: Location | null;
}

export interface MatchResult {
  psychologistId: number;
  score: number;
  band: 'alta' | 'boa' | 'possivel';
  components: Record<Component, number>;
  /** Straight-line distance to the office, when both addresses have coordinates. */
  distanceKm: number | null;
  reasons: string[];
  considerations: string[];
}

export interface MatchOutcome {
  results: MatchResult[];
  excluded: Partial<Record<ExclusionReason, number>>;
}

/* ───────────── helpers ───────────── */

/** Section 7: compatibility between two 1–5 answers. */
export const similarity = (a: number, b: number) => 1 - Math.abs(a - b) / 4;

const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const round = (v: number) => Math.round(v * 1000) / 1000;

export const normalizeCity = (city: string) =>
  city
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function ageAt(birthDate: Date, now = new Date()) {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export function ageGroup(birthDate: Date, now = new Date()): AgeGroup {
  const age = ageAt(birthDate, now);
  if (age < 12) return 'criancas';
  if (age < 18) return 'adolescentes';
  if (age < 60) return 'adultos';
  return 'idosos';
}

/** Weighted mean of the dimensions answered by both sides ("compatibilidades válidas"). */
function weightedMean(pairs: Array<[number | null, number | null, number?]>): number | null {
  let total = 0;
  let weight = 0;
  for (const [a, b, w = 1] of pairs) {
    if (a === null || b === null) continue;
    total += similarity(a, b) * w;
    weight += w;
  }
  return weight ? total / weight : null;
}

const mean = (...values: Array<number | null>) => {
  const valid = values.filter((v): v is number => v !== null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

/** Priority demands (P01) weigh 2, other topics of interest (P19) weigh 1. "Outro" can't be matched. */
function demandWeights(p: Answers): Map<string, number> {
  const weights = new Map<string, number>();
  for (const d of list(p.P19)) weights.set(d, 1);
  for (const d of list(p.P01)) weights.set(d, 2);
  weights.delete('outro');
  return weights;
}

const PRACTICE_SCORE: Record<string, number> = { lt1: 0, '1-3': 0.25, '3-5': 0.5, '5-10': 0.75, '10+': 1 };
const RESISTANCE_TO_DIRECTION: Record<string, number> = { nao_insistir: 1, perguntar_suavemente: 2, incentivar: 4, ser_direto: 5 };
const RELATION_TO_WARMTH: Record<string, number> = { objetiva: 2, profissional_acolhedora: 3.5, muito_acolhedora: 5 };

/* ───────────── location ───────────── */

/** Farther than this, in-person care is not considered viable. */
export const MAX_IN_PERSON_KM = 25;

export function distanceBetween(a?: Location | null, b?: Location | null): number | null {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  return Math.round(distanceKm(a, b) * 10) / 10;
}

/** Whether the patient can reach the office: by distance when known, otherwise same city. */
export function withinReach(patient: PatientProfile, psy: PsychologistProfile) {
  const km = distanceBetween(patient.location, psy.location);
  if (km !== null) return { ok: km <= MAX_IN_PERSON_KM, km };
  const a = text(patient.location?.city);
  const b = text(psy.location?.city);
  return { ok: !!a && !!b && normalizeCity(a) === normalizeCity(b), km: null };
}

/** 1 up to 1.5 km, falling linearly to 0.3 at 12 km (roughly crossing Recife). Unknown distance = 0.6. */
export function proximity(km: number | null) {
  if (km === null) return 0.6;
  if (km <= 1.5) return 1;
  return Math.max(0.3, 1 - (0.7 * (km - 1.5)) / 10.5);
}

export const formatKm = (km: number) => (km < 1 ? 'menos de 1 km' : `${km.toFixed(1).replace('.', ',')} km`);

/* ───────────── hard filters (section 6) ───────────── */

export function hardFilter(patient: PatientProfile, psy: PsychologistProfile): ExclusionReason | null {
  const p = patient.answers;
  const s = psy.answers;

  const psyModes = list(s.S14);
  const online = psyModes.includes('online');
  const inPerson = psyModes.includes('presencial');
  const reachable = inPerson && withinReach(patient, psy).ok;

  switch (p.P20) {
    case 'online':
      if (!online) return 'modalidade';
      break;
    case 'presencial':
      if (!inPerson) return 'modalidade';
      if (!reachable) return 'regiao';
      break;
    default:
      if (!online && !reachable) return inPerson ? 'regiao' : 'modalidade';
  }

  if (!list(s.S02).includes(ageGroup(patient.birthDate))) return 'faixa_etaria';

  const refused = list(s.S13);
  if (list(p.P01).some((d) => refused.includes(d))) return 'demanda_nao_atendida';

  const psySlots = new Set(list(s.S16));
  if (!list(p.P22).some((slot) => psySlots.has(slot))) return 'sem_horario';

  // Safety routing: not a score, just who can safely receive the referral.
  if (isRiskLevel(patient.safetyLevel) && s.S18 === 'encaminha_risco') return 'protocolo_seguranca';

  return null;
}

/* ───────────── components ───────────── */

export function scoreComponents(patient: PatientProfile, psy: PsychologistProfile) {
  const p = patient.answers;
  const s = psy.answers;
  const demands = demandWeights(p);
  const psyDemands = new Set(list(s.S03));
  const levels = (s.S04 ?? {}) as Record<string, number>;

  let demandHit = 0;
  let demandTotal = 0;
  let levelSum = 0;
  demands.forEach((w, d) => {
    demandTotal += w;
    if (psyDemands.has(d)) {
      demandHit += w;
      levelSum += w * (((levels[d] ?? 1) - 1) / 4);
    }
  });
  const demanda = demandTotal ? demandHit / demandTotal : 0.5;
  const levelScore = demandTotal ? levelSum / demandTotal : 0.5;
  const experiencia = 0.85 * levelScore + 0.15 * (PRACTICE_SCORE[text(s.S01)] ?? 0);

  // Estilo terapêutico: mirrored questions (section 5). P06 "conversar livremente" is the inverse of structure.
  const estilo =
    weightedMean([
      [num(p.P06) === null ? null : 6 - (p.P06 as number), num(s.S06)],
      [num(p.P05), num(s.S09)],
      [num(p.P11), num(s.S08)],
      [num(p.P07), num(s.S07)],
      [num(p.P10), num(s.S12)],
      [num(p.P09), num(s.S11)],
      [num(p.P08), num(s.S10)],
    ]) ?? 0.5;

  const warmthFromRelation = RELATION_TO_WARMTH[text(p.P12)] ?? null;
  const relacao =
    weightedMean([
      [mean(num(p.P28), warmthFromRelation), num(s.S19)],
      [num(p.P29), num(s.S20)],
      [mean(num(p.P30), num(p.P03)), num(s.S21)],
      [num(p.P15), num(s.S20), 0.5],
      [RESISTANCE_TO_DIRECTION[text(p.P16)] ?? null, num(s.S09), 0.5],
    ]) ?? 0.5;

  const psySlots = new Set(list(s.S16));
  const commonSlots = list(p.P22).filter((slot) => psySlots.has(slot)).length;
  const disponibilidade = Math.min(1, commonSlots / 3);

  const psyModes = list(s.S14);
  const reach = withinReach(patient, psy);
  const inPersonOk = psyModes.includes('presencial') && reach.ok;
  let localizacao = 1;
  if (p.P20 === 'presencial') localizacao = proximity(reach.km);
  else if (p.P20 === 'tanto_faz') {
    // Online is a solid option; a nearby office (possibly on top of online) is better.
    localizacao = Math.max(psyModes.includes('online') ? 0.8 : 0, inPersonOk ? 0.55 + 0.45 * proximity(reach.km) : 0);
  }

  const checks: boolean[] = [];
  if (p.P17 === 'homem') checks.push(/^masc/i.test(psy.gender));
  if (p.P17 === 'mulher') checks.push(/^fem/i.test(psy.gender));
  const traits = list(p.P18);
  const psyAge = ageAt(psy.birthDate);
  if (traits.includes('mais_experiente')) checks.push(['5-10', '10+'].includes(text(s.S01)));
  if (traits.includes('mais_jovem')) checks.push(psyAge < 35);
  if (traits.includes('faixa_semelhante')) checks.push(Math.abs(psyAge - ageAt(patient.birthDate)) <= 10);
  const preferencias = checks.length ? checks.filter(Boolean).length / checks.length : 1;

  return {
    components: { demanda, estilo, experiencia, relacao, disponibilidade, localizacao, preferencias },
    commonSlots,
    inPersonOk,
    distanceKm: distanceBetween(patient.location, psy.location),
    matchedDemands: [...demands.keys()].filter((d) => psyDemands.has(d)).sort((a, b) => demands.get(b)! - demands.get(a)!),
    hasPreferences: checks.length > 0,
  };
}

/* ───────────── explanation (section 9) ───────────── */

function explain(patient: PatientProfile, psy: PsychologistProfile, parts: ReturnType<typeof scoreComponents>) {
  const { components: c, matchedDemands, commonSlots, distanceKm: km } = parts;
  const reasons: string[] = [];
  const considerations: string[] = [];

  if (matchedDemands.length) {
    const names = matchedDemands.slice(0, 2).map((d) => labelOf(DEMANDS, d).toLowerCase());
    reasons.push(`Experiência declarada em ${names.join(' e ')}`);
  }
  if (c.estilo >= 0.75) reasons.push('Estilo de condução parecido com o que você prefere');
  else if (c.estilo < 0.5) considerations.push('Estilo de condução diferente do que você descreveu');
  if (c.relacao >= 0.75) reasons.push('Forma de se relacionar alinhada ao que você espera');
  if (commonSlots > 0) reasons.push(commonSlots === 1 ? '1 período em comum na agenda' : `${commonSlots} períodos em comum na agenda`);

  const mode = patient.answers.P20;
  const place = psy.location?.neighborhood || psy.location?.city || 'sua cidade';
  const office = km === null ? `Consultório em ${place}` : `Consultório em ${place}, a ${formatKm(km)} de você`;
  if (mode === 'online' || !parts.inPersonOk) reasons.push('Atende online');
  else if (mode === 'tanto_faz' && list(psy.answers.S14).includes('online')) reasons.push(`${office} · também atende online`);
  else reasons.push(office);
  if (mode === 'presencial' && km !== null && km > 8) considerations.push(`Consultório mais distante (${formatKm(km)})`);

  if (parts.hasPreferences && c.preferencias === 1) reasons.push('Atende às suas preferências pessoais');
  if (matchedDemands.length === 0) considerations.push('Sem experiência declarada nas suas demandas prioritárias');

  return { reasons, considerations };
}

export function computeScore(components: Record<Component, number>) {
  return (Object.keys(WEIGHTS) as Component[]).reduce((sum, k) => sum + WEIGHTS[k] * components[k], 0);
}

export function band(score: number): MatchResult['band'] {
  if (score >= 0.75) return 'alta';
  if (score >= 0.55) return 'boa';
  return 'possivel';
}

/** Section 8 pseudocode: filter, score, sort. */
export function findMatches(patient: PatientProfile, psychologists: PsychologistProfile[]): MatchOutcome {
  const results: MatchResult[] = [];
  const excluded: MatchOutcome['excluded'] = {};

  for (const psy of psychologists) {
    const reason = hardFilter(patient, psy);
    if (reason) {
      excluded[reason] = (excluded[reason] ?? 0) + 1;
      continue;
    }
    const parts = scoreComponents(patient, psy);
    const score = computeScore(parts.components);
    const { reasons, considerations } = explain(patient, psy, parts);
    results.push({
      psychologistId: psy.id,
      score: round(score),
      band: band(score),
      components: Object.fromEntries(Object.entries(parts.components).map(([k, v]) => [k, round(v)])) as Record<Component, number>,
      distanceKm: parts.distanceKm,
      reasons,
      considerations,
    });
  }

  // Ties go to the closer office, then to the lower id (stable, deterministic order).
  results.sort(
    (a, b) => b.score - a.score || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.psychologistId - b.psychologistId,
  );
  return { results, excluded };
}
