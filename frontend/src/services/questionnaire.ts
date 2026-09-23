// Mirrors backend/src/triage/questionnaire/types.ts — the API is the source of truth.
export type QuestionType = 'single' | 'multi' | 'scale' | 'schedule' | 'text' | 'matrix';

export interface Option {
  value: string;
  label: string;
}

export interface QuestionDef {
  code: string;
  type: QuestionType;
  prompt: string;
  help?: string;
  required: boolean;
  usage: string;
  options?: Option[];
  maxSelections?: number;
  rowsFrom?: string;
  scale?: { minLabel: string; maxLabel: string; allowNotApplicable?: boolean };
  maxLength?: number;
  showIf?: { code: string; in?: string[]; notIn?: string[] };
  exclusive?: string[];
}

export interface SectionDef {
  id: string;
  title: string;
  subtitle?: string;
  questions: QuestionDef[];
}

export interface Questionnaire {
  audience: 'PATIENT' | 'PSYCHOLOGIST';
  version: string;
  sections: SectionDef[];
}

export type AnswerValue = string | string[] | number | null | Record<string, number>;
export type Answers = Record<string, AnswerValue | undefined>;

export type SafetyLevel = 'NONE' | 'WANTS_TALK' | 'ELEVATED' | 'IMMEDIATE';
export interface SupportResource {
  name: string;
  detail: string;
  href?: string;
}
export interface Safety {
  level: SafetyLevel;
  resources: SupportResource[];
}

export function isVisible(q: QuestionDef, answers: Answers) {
  const rule = q.showIf;
  if (!rule) return true;
  const raw = answers[rule.code];
  const values = Array.isArray(raw) ? raw : raw == null ? [] : [String(raw)];
  if (rule.in) return values.some((v) => rule.in!.includes(v));
  if (rule.notIn) return values.length > 0 && values.every((v) => !rule.notIn!.includes(v));
  return true;
}

export function isAnswered(q: QuestionDef, value: AnswerValue | undefined, answers: Answers) {
  if (q.type === 'scale' && q.scale?.allowNotApplicable && value === null) return true;
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const rows = (answers[q.rowsFrom ?? ''] as string[] | undefined) ?? [];
    return rows.every((r) => typeof (value as Record<string, number>)[r] === 'number');
  }
  return true;
}

/** Only answers to questions that are still visible are sent (hidden ones would be rejected/ignored). */
export function visibleAnswers(q: Questionnaire, answers: Answers) {
  const out: Record<string, AnswerValue> = {};
  for (const section of q.sections) {
    for (const question of section.questions) {
      const v = answers[question.code];
      if (v !== undefined && isVisible(question, answers)) out[question.code] = v;
    }
  }
  return out;
}

export const WEEKDAYS = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export const PERIODS = [
  { value: 'manha', label: 'Manhã', hint: '8h–12h' },
  { value: 'tarde', label: 'Tarde', hint: '12h–18h' },
  { value: 'noite', label: 'Noite', hint: '18h–22h' },
];
