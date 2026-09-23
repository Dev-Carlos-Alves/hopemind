import { Option } from './types';

/** Demand categories shared by P01, P19, S03, S04 and S13 ("mesmas categorias de P01"). */
export const DEMANDS: Option[] = [
  { value: 'ansiedade', label: 'Ansiedade' },
  { value: 'humor', label: 'Humor / desânimo' },
  { value: 'estresse', label: 'Estresse' },
  { value: 'relacionamentos', label: 'Relacionamentos' },
  { value: 'familia', label: 'Família' },
  { value: 'trabalho', label: 'Trabalho / carreira' },
  { value: 'estudos', label: 'Estudos' },
  { value: 'autoestima', label: 'Autoestima' },
  { value: 'luto', label: 'Luto' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'sono', label: 'Sono' },
  { value: 'habitos', label: 'Hábitos / comportamentos' },
  { value: 'sexualidade', label: 'Sexualidade' },
  { value: 'identidade', label: 'Identidade' },
  { value: 'social', label: 'Dificuldades sociais' },
  { value: 'outro', label: 'Outro' },
];

export const GOALS: Option[] = [
  { value: 'resolver_problema', label: 'Resolver um problema específico' },
  { value: 'emocoes', label: 'Lidar melhor com emoções' },
  { value: 'sintomas', label: 'Reduzir sintomas' },
  { value: 'relacionamentos', label: 'Melhorar relacionamentos' },
  { value: 'autoestima', label: 'Autoestima' },
  { value: 'autoconhecimento', label: 'Autoconhecimento' },
  { value: 'comportamentos', label: 'Mudar comportamentos' },
  { value: 'situacao_dificil', label: 'Lidar com uma situação difícil' },
  { value: 'desempenho', label: 'Desempenho' },
  { value: 'nao_sei', label: 'Ainda não sei' },
];

export const PUBLICS: Option[] = [
  { value: 'criancas', label: 'Crianças' },
  { value: 'adolescentes', label: 'Adolescentes' },
  { value: 'adultos', label: 'Adultos' },
  { value: 'idosos', label: 'Idosos' },
  { value: 'casais', label: 'Casais' },
  { value: 'familias', label: 'Famílias' },
];

export const APPROACHES: Option[] = [
  { value: 'tcc', label: 'TCC' },
  { value: 'psicanalise', label: 'Psicanálise' },
  { value: 'psicodinamica', label: 'Psicodinâmica' },
  { value: 'humanista', label: 'Humanista' },
  { value: 'gestalt', label: 'Gestalt' },
  { value: 'sistemica', label: 'Sistêmica' },
  { value: 'comportamental', label: 'Comportamental' },
  { value: 'act', label: 'ACT' },
  { value: 'dbt', label: 'DBT' },
  { value: 'esquema', label: 'Terapia do Esquema' },
  { value: 'emdr', label: 'EMDR' },
  { value: 'outra', label: 'Outra' },
];

export const WEEKDAYS: Option[] = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export const PERIODS: Option[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

export const SCHEDULE_SLOTS = WEEKDAYS.flatMap((d) => PERIODS.map((p) => `${d.value}-${p.value}`));

export const PRACTICE_TIME: Option[] = [
  { value: 'lt1', label: 'Menos de 1 ano' },
  { value: '1-3', label: '1 a 3 anos' },
  { value: '3-5', label: '3 a 5 anos' },
  { value: '5-10', label: '5 a 10 anos' },
  { value: '10+', label: 'Mais de 10 anos' },
];

export const labelOf = (options: Option[], value: string) => options.find((o) => o.value === value)?.label ?? value;
