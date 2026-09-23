import { SCHEDULE_SLOTS } from './catalog';
import { PATIENT_QUESTIONNAIRE } from './patient';
import { PSYCHOLOGIST_QUESTIONNAIRE } from './psychologist';
import { Answers, AnswerValue, Audience, QuestionDef, Questionnaire } from './types';

export * from './types';
export { PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE };

export const questionnaireFor = (audience: Audience): Questionnaire =>
  audience === 'PSYCHOLOGIST' ? PSYCHOLOGIST_QUESTIONNAIRE : PATIENT_QUESTIONNAIRE;

export const allQuestions = (q: Questionnaire): QuestionDef[] => q.sections.flatMap((s) => s.questions);

export function isVisible(question: QuestionDef, answers: Answers): boolean {
  const rule = question.showIf;
  if (!rule) return true;
  const raw = answers[rule.code];
  const values = Array.isArray(raw) ? raw : raw == null ? [] : [String(raw)];
  if (rule.in) return values.some((v) => rule.in!.includes(v));
  if (rule.notIn) return values.length > 0 && values.every((v) => !rule.notIn!.includes(v));
  return true;
}

export class AnswerValidationError extends Error {}

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);

const isScale = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;

/**
 * Checks raw answers against the questionnaire definition and returns a clean copy:
 * hidden questions and unknown codes are dropped, types and option values are enforced.
 */
export function sanitizeAnswers(questionnaire: Questionnaire, raw: Record<string, unknown>): Answers {
  const result: Answers = {};
  const fail = (q: QuestionDef, msg: string): never => {
    throw new AnswerValidationError(`${q.code} — ${q.prompt}: ${msg}`);
  };

  for (const q of allQuestions(questionnaire)) {
    if (!isVisible(q, result)) continue;
    const value = raw[q.code];

    if (isEmpty(value)) {
      if (q.required && !(q.type === 'scale' && q.scale?.allowNotApplicable && value === null)) {
        fail(q, 'resposta obrigatória.');
      }
      if (q.type === 'scale' && q.scale?.allowNotApplicable && value === null) result[q.code] = null;
      continue;
    }

    const optionValues = q.options?.map((o) => o.value) ?? [];
    let clean: AnswerValue;

    switch (q.type) {
      case 'single':
        if (typeof value !== 'string' || !optionValues.includes(value)) fail(q, 'opção inválida.');
        clean = value as string;
        break;

      case 'multi': {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !optionValues.includes(v))) {
          fail(q, 'opção inválida.');
        }
        const unique = Array.from(new Set(value as string[]));
        if (q.maxSelections && unique.length > q.maxSelections) fail(q, `escolha no máximo ${q.maxSelections}.`);
        const exclusive = unique.filter((v) => q.exclusive?.includes(v));
        clean = exclusive.length ? [exclusive[0]] : unique;
        break;
      }

      case 'scale':
        if (!isScale(value)) fail(q, 'valor deve ser de 1 a 5.');
        clean = value as number;
        break;

      case 'schedule': {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !SCHEDULE_SLOTS.includes(v))) {
          fail(q, 'horário inválido.');
        }
        clean = Array.from(new Set(value as string[]));
        break;
      }

      case 'text': {
        if (typeof value !== 'string') fail(q, 'texto inválido.');
        const text = (value as string).trim();
        if (q.maxLength && text.length > q.maxLength) fail(q, `máximo de ${q.maxLength} caracteres.`);
        clean = text;
        break;
      }

      case 'matrix': {
        const rows = (result[q.rowsFrom!] as string[] | undefined) ?? [];
        if (typeof value !== 'object' || Array.isArray(value)) fail(q, 'formato inválido.');
        const matrix: Record<string, number> = {};
        for (const row of rows) {
          const level = (value as Record<string, unknown>)[row];
          if (level === undefined) {
            if (q.required) fail(q, 'informe o nível de todas as demandas selecionadas.');
            continue;
          }
          if (!isScale(level)) fail(q, 'nível deve ser de 1 a 5.');
          matrix[row] = level as number;
        }
        clean = matrix;
        break;
      }
    }

    result[q.code] = clean!;
  }

  return result;
}
