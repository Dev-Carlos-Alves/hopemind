import { Answers } from '../questionnaire';

export type SafetyLevelCode = 'NONE' | 'WANTS_TALK' | 'ELEVATED' | 'IMMEDIATE';

export interface SupportResource {
  name: string;
  detail: string;
  href?: string;
}

/** Brazilian crisis resources shown whenever a risk answer is given. */
export const SUPPORT_RESOURCES: SupportResource[] = [
  { name: 'CVV — Centro de Valorização da Vida', detail: 'Ligue 188, 24 horas, gratuito. Também por chat em cvv.org.br.', href: 'tel:188' },
  { name: 'SAMU', detail: 'Em emergência médica, ligue 192.', href: 'tel:192' },
  { name: 'Pronto-socorro / UPA', detail: 'Se estiver em perigo agora, procure o serviço de urgência mais próximo.' },
];

/**
 * Section 1 of the requirements: risk answers drive a safety/referral flow and never
 * add or remove points from the ranking.
 */
export function evaluateSafety(answers: Answers): SafetyLevelCode {
  const immediate = answers.P27;
  const selfHarm = answers.P26;
  if (immediate === 'sim') return 'IMMEDIATE';
  if (selfHarm === 'sim' || immediate === 'nao_sei') return 'ELEVATED';
  if (selfHarm === 'conversar') return 'WANTS_TALK';
  return 'NONE';
}

export const isRiskLevel = (level: SafetyLevelCode) => level === 'ELEVATED' || level === 'IMMEDIATE';
