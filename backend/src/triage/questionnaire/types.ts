export type Audience = 'PATIENT' | 'PSYCHOLOGIST';

export type QuestionType = 'single' | 'multi' | 'scale' | 'schedule' | 'text' | 'matrix';

/** How the answer is used by the algorithm (column "Uso" in the requirements doc). */
export type QuestionUsage = 'filtro' | 'alta' | 'media' | 'baixa' | 'apoio' | 'seguranca' | 'informativo';

export interface Option {
  value: string;
  label: string;
}

export interface ShowIf {
  code: string;
  in?: string[];
  notIn?: string[];
}

export interface QuestionDef {
  /** Code from the requirements doc (P01, S06...). */
  code: string;
  variable: string;
  type: QuestionType;
  prompt: string;
  help?: string;
  required: boolean;
  usage: QuestionUsage;
  options?: Option[];
  maxSelections?: number;
  /** Matrix rows come from the answers of another multi-choice question. */
  rowsFrom?: string;
  scale?: { minLabel: string; maxLabel: string; allowNotApplicable?: boolean };
  maxLength?: number;
  showIf?: ShowIf;
  /** Answer choices that make other choices meaningless (e.g. "sem preferência"). */
  exclusive?: string[];
}

export interface SectionDef {
  id: string;
  title: string;
  subtitle?: string;
  questions: QuestionDef[];
}

export interface Questionnaire {
  audience: Audience;
  version: string;
  sections: SectionDef[];
}

export type AnswerValue = string | string[] | number | null | Record<string, number>;
export type Answers = Record<string, AnswerValue>;
