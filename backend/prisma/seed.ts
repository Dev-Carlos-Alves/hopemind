import { Prisma, PrismaClient, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Answers, PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE, sanitizeAnswers } from '../src/triage/questionnaire';
import { evaluateSafety } from '../src/triage/match/safety';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'hopemind123';

const slots = (spec: string) => spec.split(/\s+/).filter(Boolean);

/* ───────────── Recife ─────────────
 * Real CEPs (ViaCEP) and neighborhood centres (OpenStreetMap/Nominatim), collected once so the
 * seed runs offline. At runtime, new addresses go through GET /api/geo/cep/:cep, which uses the
 * same sources. */
const RECIFE = {
  boaViagem: { cep: '51020-010', street: 'Rua dos Navegantes', neighborhood: 'Boa Viagem', latitude: -8.1235, longitude: -34.9034 },
  pina: { cep: '51110-130', street: 'Avenida Herculano Bandeira', neighborhood: 'Pina', latitude: -8.0963, longitude: -34.89469 },
  casaForte: { cep: '52061-420', street: 'Praça de Casa Forte', neighborhood: 'Casa Forte', latitude: -8.03378, longitude: -34.91831 },
  gracas: { cep: '52011-050', street: 'Rua Amélia', neighborhood: 'Graças', latitude: -8.04517, longitude: -34.90077 },
  espinheiro: { cep: '52020-025', street: 'Rua do Espinheiro', neighborhood: 'Espinheiro', latitude: -8.04287, longitude: -34.89128 },
  derby: { cep: '52010-140', street: 'Praça do Derby', neighborhood: 'Derby', latitude: -8.05778, longitude: -34.89904 },
  boaVista: { cep: '50050-050', street: 'Rua do Hospício', neighborhood: 'Boa Vista', latitude: -8.06175, longitude: -34.88727 },
  madalena: { cep: '50610-000', street: 'Rua Real da Torre', neighborhood: 'Madalena', latitude: -8.05376, longitude: -34.90837 },
  torre: { cep: '50710-310', street: 'Rua Conde de Irajá', neighborhood: 'Torre', latitude: -8.04251, longitude: -34.90746 },
  parnamirim: { cep: '52060-210', street: 'Estrada do Encanamento', neighborhood: 'Parnamirim', latitude: -8.03389, longitude: -34.9104 },
  jaqueira: { cep: '52050-660', street: 'Rua do Futuro', neighborhood: 'Jaqueira', latitude: -8.036, longitude: -34.9026 },
  tamarineira: { cep: '52051-020', street: 'Rua Cônego Barata', neighborhood: 'Tamarineira', latitude: -8.03242, longitude: -34.90102 },
  casaAmarela: { cep: '52070-200', street: 'Rua Padre Lemos', neighborhood: 'Casa Amarela', latitude: -8.02463, longitude: -34.91775 },
  varzea: { cep: '50810-000', street: 'Avenida Afonso Olindense', neighborhood: 'Várzea', latitude: -8.04504, longitude: -34.96917 },
  cordeiro: { cep: '50630-060', street: 'Avenida General San Martin', neighborhood: 'Cordeiro', latitude: -8.05112, longitude: -34.92854 },
  ipsep: { cep: '51350-670', street: 'Avenida Recife', neighborhood: 'Ipsep', latitude: -8.11023, longitude: -34.9199 },
  bairroDoRecife: { cep: '50030-310', street: 'Avenida Rio Branco', neighborhood: 'Recife', latitude: -8.06325, longitude: -34.87271 },
  encruzilhada: { cep: '52041-430', street: 'Avenida Beberibe', neighborhood: 'Encruzilhada', latitude: -8.03673, longitude: -34.89087 },
  poco: { cep: '52061-200', street: 'Estrada Real do Poço', neighborhood: 'Poço', latitude: -8.03511, longitude: -34.92387 },
  apipucos: { cep: '52071-405', street: 'Rua de Apipucos', neighborhood: 'Apipucos', latitude: -8.01902, longitude: -34.93813 },
  santoAmaro: { cep: '50050-425', street: 'Rua do Príncipe', neighborhood: 'Santo Amaro', latitude: -8.05093, longitude: -34.88145 },
} as const;

type Place = keyof typeof RECIFE;

/* Answer "styles" for S06–S12 and S19–S21, so each profile only states what makes it different. */
const STYLES = {
  estruturado: { S06: 5, S07: 5, S08: 4, S09: 4, S10: 2, S11: 5, S12: 3, S19: 3, S20: 4, S21: 5 },
  exploratorio: { S06: 1, S07: 2, S08: 2, S09: 1, S10: 5, S11: 2, S12: 4, S19: 4, S20: 2, S21: 2 },
  acolhedor: { S06: 2, S07: 3, S08: 3, S09: 2, S10: 4, S11: 4, S12: 5, S19: 5, S20: 3, S21: 3 },
  integrativo: { S06: 3, S07: 3, S08: 3, S09: 3, S10: 4, S11: 4, S12: 4, S19: 4, S20: 3, S21: 4 },
} as const;

interface DemoPsychologist {
  email: string;
  name: string;
  gender: 'Feminino' | 'Masculino';
  birthDate: string;
  cpf: string;
  crp: string;
  place: Place;
  number: string;
  specialty: string;
  approach: string;
  fee: number;
  biography: string;
  practice: string;
  publics: string[];
  approaches: string[];
  /** S03 + S04: demand → experience level (1–5). */
  demands: Record<string, number>;
  refuses?: string[];
  style: keyof typeof STYLES;
  profiles?: string[];
  modes: Array<'online' | 'presencial'>;
  schedule: string;
  risk?: 'atende_risco' | 'encaminha_risco';
  tweaks?: Answers;
}

// Fictitious professionals. Varied on purpose so the demo exercises every filter and component.
const PSYCHOLOGISTS: DemoPsychologist[] = [
  {
    email: 'rafael@hopemind.local', name: 'Rafael Moura', gender: 'Masculino', birthDate: '1988-10-20', cpf: '55566677788',
    crp: 'CRP 02/12345', place: 'espinheiro', number: '410', specialty: 'Terapia Cognitivo-Comportamental', approach: 'TCC e ACT', fee: 150,
    biography: 'Trabalho com ansiedade, estresse e questões de carreira usando técnicas práticas e metas combinadas a cada etapa.',
    practice: '5-10', publics: ['adolescentes', 'adultos'], approaches: ['tcc', 'act'],
    demands: { ansiedade: 5, estresse: 5, trabalho: 4, sono: 3, habitos: 4 }, style: 'estruturado', profiles: ['objetivos', 'orientacao_pratica'],
    modes: ['online', 'presencial'], schedule: 'seg-tarde ter-tarde qua-tarde qui-tarde seg-noite ter-noite qui-noite',
  },
  {
    email: 'roberto@hopemind.local', name: 'Roberto Silva', gender: 'Masculino', birthDate: '1975-03-12', cpf: '99988877766',
    crp: 'CRP 02/09876', place: 'casaForte', number: '88', specialty: 'Psicanálise Clínica', approach: 'Psicanálise', fee: 180,
    biography: 'Atendimento voltado ao autoconhecimento, a quadros depressivos e a conflitos relacionais, no tempo de cada pessoa.',
    practice: '10+', publics: ['adultos', 'idosos'], approaches: ['psicanalise'],
    demands: { humor: 5, relacionamentos: 5, autoestima: 4, luto: 4, identidade: 3 }, style: 'exploratorio', profiles: ['autoconhecimento', 'exploracao_emocional'],
    modes: ['presencial'], schedule: 'seg-manha qua-manha sex-manha',
  },
  {
    email: 'camila@hopemind.local', name: 'Camila Rocha', gender: 'Feminino', birthDate: '1992-07-08', cpf: '22233344455',
    crp: 'CRP 02/23456', place: 'boaVista', number: '215', specialty: 'Psicologia Humanista', approach: 'Humanista e ACT', fee: 140,
    biography: 'Escuta acolhedora para ansiedade, autoestima e questões de identidade e sexualidade, com espaço para você conduzir o ritmo.',
    practice: '3-5', publics: ['adolescentes', 'adultos'], approaches: ['humanista', 'act'],
    demands: { ansiedade: 4, autoestima: 5, identidade: 5, sexualidade: 4, relacionamentos: 3 }, style: 'acolhedor', profiles: ['reservado', 'autoconhecimento'],
    modes: ['online'], schedule: 'ter-noite qui-noite sab-manha sab-tarde',
  },
  {
    email: 'felipe@hopemind.local', name: 'Felipe Andrade', gender: 'Masculino', birthDate: '1984-01-30', cpf: '33344455566',
    crp: 'CRP 02/34567', place: 'derby', number: '52', specialty: 'Terapia Comportamental Dialética (DBT)', approach: 'DBT e TCC', fee: 200,
    biography: 'Foco em regulação emocional, trauma e mudança de hábitos, com plano de tratamento claro e tarefas entre as sessões.',
    practice: '10+', publics: ['adultos'], approaches: ['dbt', 'tcc'],
    demands: { trauma: 5, habitos: 5, humor: 4, sono: 4, ansiedade: 3 }, refuses: ['familia'], style: 'estruturado', profiles: ['objetivos', 'orientacao_pratica'],
    modes: ['online', 'presencial'], schedule: 'seg-tarde qua-tarde sex-tarde', tweaks: { S08: 5, S09: 5, S20: 5 },
  },
  {
    email: 'juliana@hopemind.local', name: 'Juliana Martins', gender: 'Feminino', birthDate: '1981-11-02', cpf: '44455566677',
    crp: 'CRP 02/45678', place: 'parnamirim', number: '301', specialty: 'Terapia Sistêmica', approach: 'Sistêmica', fee: 170,
    biography: 'Atendo casais, famílias e adolescentes, olhando para a relação entre as pessoas e não só para o indivíduo.',
    practice: '10+', publics: ['adolescentes', 'adultos', 'casais', 'familias'], approaches: ['sistemica'],
    demands: { familia: 5, relacionamentos: 5, estudos: 3, social: 3 }, refuses: ['trauma'], style: 'integrativo', profiles: ['comunicativo'],
    modes: ['online', 'presencial'], schedule: 'seg-manha ter-manha qua-manha qua-tarde', risk: 'encaminha_risco',
  },
  {
    email: 'beatriz@hopemind.local', name: 'Beatriz Nogueira', gender: 'Feminino', birthDate: '1979-05-19', cpf: '66677788899',
    crp: 'CRP 02/56789', place: 'boaViagem', number: '1200', specialty: 'Trauma e Luto', approach: 'EMDR e Terapia do Esquema', fee: 220,
    biography: 'Especializada em trauma, luto e ansiedade, com um cuidado especial para que você se sinta seguro em cada sessão.',
    practice: '10+', publics: ['adultos', 'idosos'], approaches: ['emdr', 'esquema'],
    demands: { trauma: 5, luto: 5, ansiedade: 4, humor: 3 }, style: 'integrativo', profiles: ['reservado', 'exploracao_emocional'],
    modes: ['online', 'presencial'], schedule: 'ter-tarde qua-tarde qui-noite', tweaks: { S19: 5, S07: 2 },
  },
  {
    email: 'thiago@hopemind.local', name: 'Thiago Lima', gender: 'Masculino', birthDate: '1995-09-14', cpf: '77788899900',
    crp: 'CRP 02/67890', place: 'torre', number: '77', specialty: 'Psicologia Psicodinâmica', approach: 'Psicodinâmica', fee: 120,
    biography: 'Atendo jovens adultos em questões de carreira, estudos, autoestima e relações sociais, sempre online e à noite.',
    practice: '1-3', publics: ['adultos'], approaches: ['psicodinamica'],
    demands: { trabalho: 4, estudos: 5, autoestima: 4, social: 4, ansiedade: 3 }, refuses: ['trauma'], style: 'exploratorio', profiles: ['comunicativo', 'autoconhecimento'],
    modes: ['online'], schedule: 'seg-noite qua-noite qui-noite sex-noite', risk: 'encaminha_risco', tweaks: { S06: 2, S07: 2, S08: 3, S09: 2 },
  },
  {
    email: 'larissa@hopemind.local', name: 'Larissa Cavalcanti', gender: 'Feminino', birthDate: '1990-02-11', cpf: '88100000001',
    crp: 'CRP 02/18231', place: 'gracas', number: '145', specialty: 'Terapia Cognitivo-Comportamental', approach: 'TCC', fee: 160,
    biography: 'Ajudo pessoas com ansiedade, estresse e insônia a entender seus padrões e a testar mudanças pequenas e possíveis.',
    practice: '3-5', publics: ['adultos'], approaches: ['tcc'],
    demands: { ansiedade: 5, estresse: 4, sono: 4, trabalho: 3 }, style: 'estruturado', profiles: ['objetivos', 'orientacao_pratica'],
    modes: ['online', 'presencial'], schedule: 'ter-noite qui-noite sab-manha', tweaks: { S19: 4 },
  },
  {
    email: 'marcelo@hopemind.local', name: 'Marcelo Albuquerque', gender: 'Masculino', birthDate: '1970-06-03', cpf: '88100000002',
    crp: 'CRP 02/04512', place: 'boaViagem', number: '3450', specialty: 'Psicanálise', approach: 'Psicanálise', fee: 250,
    biography: 'Mais de 25 anos de clínica com adultos e idosos, especialmente em luto, perdas e mudanças de fase da vida.',
    practice: '10+', publics: ['adultos', 'idosos'], approaches: ['psicanalise'],
    demands: { luto: 5, humor: 4, relacionamentos: 4 }, style: 'exploratorio', profiles: ['exploracao_emocional'],
    modes: ['presencial'], schedule: 'qua-tarde qui-tarde',
  },
  {
    email: 'patricia@hopemind.local', name: 'Patrícia Lins', gender: 'Feminino', birthDate: '1986-12-22', cpf: '88100000003',
    crp: 'CRP 02/15670', place: 'casaAmarela', number: '60', specialty: 'Gestalt-terapia', approach: 'Gestalt', fee: 150,
    biography: 'Atendimento focado no aqui e agora, para quem quer se conhecer melhor, lidar com a autoestima e com as relações.',
    practice: '5-10', publics: ['adultos'], approaches: ['gestalt'],
    demands: { autoestima: 5, relacionamentos: 4, ansiedade: 3, identidade: 4 }, style: 'acolhedor', profiles: ['autoconhecimento', 'reservado'],
    modes: ['online', 'presencial'], schedule: 'ter-noite qua-noite qui-noite',
  },
  {
    email: 'gabriel@hopemind.local', name: 'Gabriel Wanderley', gender: 'Masculino', birthDate: '1993-04-17', cpf: '88100000004',
    crp: 'CRP 02/22019', place: 'madalena', number: '930', specialty: 'Terapia de Aceitação e Compromisso', approach: 'ACT e TCC', fee: 130,
    biography: 'Trabalho com universitários e profissionais no início de carreira: ansiedade, pressão por desempenho e escolhas.',
    practice: '1-3', publics: ['adolescentes', 'adultos'], approaches: ['act', 'tcc'],
    demands: { ansiedade: 4, estresse: 4, trabalho: 5, estudos: 5 }, style: 'estruturado', profiles: ['comunicativo', 'objetivos'],
    modes: ['online'], schedule: 'seg-noite ter-noite qua-noite qui-noite sex-noite', tweaks: { S06: 4, S19: 4 },
  },
  {
    email: 'renata@hopemind.local', name: 'Renata Barros', gender: 'Feminino', birthDate: '1983-08-09', cpf: '88100000005',
    crp: 'CRP 02/11408', place: 'jaqueira', number: '25', specialty: 'Psicologia Infantil', approach: 'TCC e Ludoterapia', fee: 170,
    biography: 'Atendo crianças e adolescentes, com orientação aos pais sobre ansiedade, escola e convivência.',
    practice: '10+', publics: ['criancas', 'adolescentes', 'familias'], approaches: ['tcc', 'outra'],
    demands: { ansiedade: 5, familia: 4, estudos: 4, social: 4 }, style: 'acolhedor', profiles: ['comunicativo'],
    modes: ['presencial'], schedule: 'seg-tarde ter-tarde qua-tarde qui-tarde',
  },
  {
    email: 'eduardo@hopemind.local', name: 'Eduardo Pessoa', gender: 'Masculino', birthDate: '1978-01-25', cpf: '88100000006',
    crp: 'CRP 02/07733', place: 'tamarineira', number: '410', specialty: 'Análise do Comportamento', approach: 'Comportamental', fee: 160,
    biography: 'Mudança de hábitos, sono e ansiedade com metas claras e acompanhamento de progresso entre as sessões.',
    practice: '10+', publics: ['adultos'], approaches: ['comportamental'],
    demands: { habitos: 5, sono: 5, ansiedade: 4, estresse: 4 }, style: 'estruturado', profiles: ['objetivos', 'orientacao_pratica'],
    modes: ['presencial'], schedule: 'qua-tarde sab-manha', tweaks: { S19: 2 },
  },
  {
    email: 'fernanda@hopemind.local', name: 'Fernanda Carneiro', gender: 'Feminino', birthDate: '1989-10-30', cpf: '88100000007',
    crp: 'CRP 02/19954', place: 'encruzilhada', number: '1580', specialty: 'Psicologia Humanista', approach: 'Abordagem Centrada na Pessoa', fee: 120,
    biography: 'Um espaço sem pressa para atravessar perdas, desânimo e fases difíceis, respeitando o seu tempo.',
    practice: '5-10', publics: ['adultos', 'idosos'], approaches: ['humanista'],
    demands: { luto: 5, humor: 4, autoestima: 4, ansiedade: 2 }, style: 'acolhedor', profiles: ['reservado', 'exploracao_emocional'],
    modes: ['online'], schedule: 'ter-noite qui-noite',
  },
  {
    email: 'lucas@hopemind.local', name: 'Lucas Siqueira', gender: 'Masculino', birthDate: '1996-03-02', cpf: '88100000008',
    crp: 'CRP 02/26511', place: 'varzea', number: '1235', specialty: 'Terapia Cognitivo-Comportamental', approach: 'TCC', fee: 90,
    biography: 'Atendo estudantes e jovens adultos perto da UFPE: ansiedade, estudos e dificuldades sociais, com valor acessível.',
    practice: '1-3', publics: ['adolescentes', 'adultos'], approaches: ['tcc'],
    demands: { estudos: 5, ansiedade: 4, social: 4 }, style: 'estruturado', profiles: ['comunicativo', 'objetivos'],
    modes: ['online', 'presencial'], schedule: 'ter-noite qua-tarde', tweaks: { S07: 4 },
  },
  {
    email: 'mariana@hopemind.local', name: 'Mariana Correia', gender: 'Feminino', birthDate: '1987-05-14', cpf: '88100000009',
    crp: 'CRP 02/14322', place: 'pina', number: '480', specialty: 'Terapia do Esquema', approach: 'Terapia do Esquema', fee: 190,
    biography: 'Trabalho padrões que se repetem em relacionamentos e na autoestima, unindo técnica e acolhimento.',
    practice: '5-10', publics: ['adultos', 'casais'], approaches: ['esquema'],
    demands: { relacionamentos: 5, autoestima: 5, ansiedade: 4, trauma: 3 }, style: 'integrativo', profiles: ['exploracao_emocional', 'objetivos'],
    modes: ['online', 'presencial'], schedule: 'qua-tarde qui-noite sex-tarde',
  },
  {
    email: 'henrique@hopemind.local', name: 'Henrique Maciel', gender: 'Masculino', birthDate: '1980-09-08', cpf: '88100000010',
    crp: 'CRP 02/08890', place: 'bairroDoRecife', number: '120', specialty: 'Terapia de Casal e Família', approach: 'Sistêmica', fee: 230,
    biography: 'Atendo casais e famílias em crises de convivência, comunicação e sexualidade, no Recife Antigo.',
    practice: '10+', publics: ['adultos', 'casais', 'familias'], approaches: ['sistemica'],
    demands: { familia: 5, relacionamentos: 5, sexualidade: 4 }, refuses: ['trabalho'], style: 'integrativo', profiles: ['comunicativo'],
    modes: ['presencial'], schedule: 'ter-noite qui-noite',
  },
  {
    email: 'aline@hopemind.local', name: 'Aline Ferraz', gender: 'Feminino', birthDate: '1991-11-19', cpf: '88100000011',
    crp: 'CRP 02/20776', place: 'cordeiro', number: '640', specialty: 'Psicologia Psicodinâmica', approach: 'Psicodinâmica', fee: 140,
    biography: 'Clínica afirmativa para questões de identidade, sexualidade e autoestima, com escuta aberta e sem julgamentos.',
    practice: '3-5', publics: ['adolescentes', 'adultos'], approaches: ['psicodinamica'],
    demands: { identidade: 5, sexualidade: 5, autoestima: 4, ansiedade: 3 }, style: 'exploratorio', profiles: ['autoconhecimento', 'reservado'],
    modes: ['online', 'presencial'], schedule: 'seg-noite ter-noite', tweaks: { S19: 5 },
  },
  {
    email: 'rodrigo@hopemind.local', name: 'Rodrigo Tenório', gender: 'Masculino', birthDate: '1985-07-27', cpf: '88100000012',
    crp: 'CRP 02/13005', place: 'ipsep', number: '2100', specialty: 'Terapia Comportamental Dialética (DBT)', approach: 'DBT', fee: 150,
    biography: 'Regulação emocional, impulsividade e trauma, com habilidades práticas treinadas sessão a sessão.',
    practice: '5-10', publics: ['adolescentes', 'adultos'], approaches: ['dbt'],
    demands: { trauma: 4, habitos: 5, humor: 4 }, style: 'estruturado', profiles: ['orientacao_pratica'],
    modes: ['presencial'], schedule: 'qua-tarde sab-manha',
  },
  {
    email: 'debora@hopemind.local', name: 'Débora Queiroz', gender: 'Feminino', birthDate: '1976-02-05', cpf: '88100000013',
    crp: 'CRP 02/06118', place: 'apipucos', number: '35', specialty: 'Psicanálise', approach: 'Psicanálise', fee: 200,
    biography: 'Atendo adultos e idosos em luto, questões familiares e sentimentos de vazio, em um consultório tranquilo em Apipucos.',
    practice: '10+', publics: ['adultos', 'idosos'], approaches: ['psicanalise'],
    demands: { luto: 5, humor: 4, familia: 4 }, style: 'exploratorio', profiles: ['exploracao_emocional', 'reservado'],
    modes: ['presencial'], schedule: 'ter-tarde qua-tarde', tweaks: { S19: 5, S12: 5 },
  },
  {
    email: 'vinicius@hopemind.local', name: 'Vinícius Arruda', gender: 'Masculino', birthDate: '1994-12-01', cpf: '88100000014',
    crp: 'CRP 02/24460', place: 'santoAmaro', number: '410', specialty: 'Psicologia Organizacional e Clínica', approach: 'TCC', fee: 140,
    biography: 'Burnout, estresse no trabalho e transições de carreira, com um plano prático para recuperar a rotina.',
    practice: '3-5', publics: ['adultos'], approaches: ['tcc'],
    demands: { trabalho: 5, estresse: 5, ansiedade: 4, sono: 3 }, style: 'estruturado', profiles: ['objetivos', 'orientacao_pratica'],
    modes: ['online', 'presencial'], schedule: 'ter-noite qui-noite qua-tarde', tweaks: { S19: 4, S21: 4 },
  },
  {
    email: 'carolina@hopemind.local', name: 'Carolina Menezes', gender: 'Feminino', birthDate: '1988-08-16', cpf: '88100000015',
    crp: 'CRP 02/17593', place: 'poco', number: '12', specialty: 'Terapia de Aceitação e Compromisso', approach: 'ACT e Humanista', fee: 160,
    biography: 'Ansiedade, estresse e autocrítica, com práticas de atenção plena e muito acolhimento no Poço da Panela.',
    practice: '5-10', publics: ['adultos'], approaches: ['act', 'humanista'],
    demands: { ansiedade: 5, estresse: 4, autoestima: 4, sono: 3 }, style: 'acolhedor', profiles: ['reservado', 'autoconhecimento'],
    modes: ['online', 'presencial'], schedule: 'qua-tarde sab-manha', tweaks: { S07: 4, S11: 5 },
  },
  {
    email: 'paulo@hopemind.local', name: 'Paulo Bezerra', gender: 'Masculino', birthDate: '1968-04-29', cpf: '88100000016',
    crp: 'CRP 02/03271', place: 'espinheiro', number: '900', specialty: 'Gestalt-terapia', approach: 'Gestalt', fee: 180,
    biography: 'Relações, timidez e perdas, com uma escuta atenta ao que acontece no encontro terapêutico.',
    practice: '10+', publics: ['adultos', 'idosos'], approaches: ['gestalt'],
    demands: { social: 5, relacionamentos: 4, luto: 4 }, style: 'acolhedor', profiles: ['reservado'],
    modes: ['presencial'], schedule: 'seg-manha ter-manha',
  },
  {
    email: 'isabela@hopemind.local', name: 'Isabela Moraes', gender: 'Feminino', birthDate: '1997-06-21', cpf: '88100000017',
    crp: 'CRP 02/28840', place: 'boaVista', number: '64', specialty: 'Terapia Cognitivo-Comportamental', approach: 'TCC e Comportamental', fee: 100,
    biography: 'Atendo adolescentes e jovens adultos com ansiedade social, estudos e autoestima, sempre online.',
    practice: 'lt1', publics: ['adolescentes', 'adultos'], approaches: ['tcc', 'comportamental'],
    demands: { ansiedade: 4, estudos: 4, social: 5, autoestima: 3 }, style: 'estruturado', profiles: ['comunicativo', 'reservado'],
    modes: ['online'], schedule: 'ter-noite qui-noite sab-tarde', tweaks: { S19: 5, S06: 4 },
  },
  {
    email: 'andre@hopemind.local', name: 'André Farias', gender: 'Masculino', birthDate: '1982-10-10', cpf: '88100000018',
    crp: 'CRP 02/10154', place: 'casaForte', number: '230', specialty: 'Trauma e EMDR', approach: 'EMDR e TCC', fee: 210,
    biography: 'Atendo pessoas que passaram por situações traumáticas, com EMDR e um plano de estabilização antes de tudo.',
    practice: '10+', publics: ['adultos'], approaches: ['emdr', 'tcc'],
    demands: { trauma: 5, ansiedade: 4, sono: 4 }, style: 'integrativo', profiles: ['orientacao_pratica', 'reservado'],
    modes: ['online', 'presencial'], schedule: 'qua-tarde qui-noite', risk: 'encaminha_risco',
  },
  {
    email: 'sofia@hopemind.local', name: 'Sofia Guerra', gender: 'Feminino', birthDate: '1984-03-18', cpf: '88100000019',
    crp: 'CRP 02/12987', place: 'jaqueira', number: '118', specialty: 'Terapia Sistêmica Individual', approach: 'Sistêmica e Humanista', fee: 170,
    biography: 'Olho para a pessoa dentro das suas relações: família, trabalho e amizades, sem perder o foco em você.',
    practice: '5-10', publics: ['adultos', 'casais'], approaches: ['sistemica', 'humanista'],
    demands: { familia: 4, relacionamentos: 5, estresse: 3, ansiedade: 3 }, style: 'integrativo', profiles: ['comunicativo', 'autoconhecimento'],
    modes: ['online', 'presencial'], schedule: 'seg-tarde qua-tarde sex-manha',
  },
];

const DEMO_PATIENT = {
  email: 'paciente@hopemind.local',
  name: 'Ana Souza',
  gender: 'Feminino',
  birthDate: '1998-05-15',
  cpf: '11122233344',
  phone: '81987654321',
  place: 'gracas' as Place,
  number: '300',
  answers: {
    P01: ['ansiedade', 'trabalho', 'estresse'], P02: ['emocoes', 'sintomas', 'comportamentos'],
    P19: ['ansiedade', 'trabalho', 'sono'],
    P03: 5, P04: 3, P05: 4, P06: 2, P07: 4, P08: 2, P09: 5,
    P10: 4, P11: 4, P15: 3, P16: 'perguntar_suavemente', P29: 4,
    P12: 'profissional_acolhedora', P28: 4, P30: 5, P13: 5, P14: 5,
    P17: 'sem_preferencia', P18: ['sem_preferencia'],
    P20: 'tanto_faz', P21: 'semanal', P22: slots('ter-noite qui-noite qua-tarde sab-manha'),
    P23: 'anteriormente', P24: 3, P25: 'Quero sair das sessões com algo prático para testar na semana.',
    P26: 'nao', P27: 'nao',
  } as Answers,
};

const addressOf = (place: Place, number: string) => ({ ...RECIFE[place], addressNumber: number, city: 'Recife', state: 'PE' });

function psychologistAnswers(p: DemoPsychologist): Answers {
  return {
    S01: p.practice,
    S02: p.publics,
    S05: p.approaches,
    S03: Object.keys(p.demands),
    S04: p.demands,
    S13: p.refuses ?? [],
    ...STYLES[p.style],
    S17: p.profiles ?? [],
    S14: p.modes,
    S16: slots(p.schedule),
    S18: p.risk ?? 'atende_risco',
    ...p.tweaks,
  };
}

async function upsertUser(data: {
  email: string;
  name: string;
  gender: string;
  birthDate: string;
  cpf: string;
  phone: string;
  userType: UserType;
  passwordHash: string;
  address: ReturnType<typeof addressOf>;
}) {
  const fields = {
    name: data.name,
    gender: data.gender,
    birthDate: new Date(data.birthDate),
    phone: data.phone,
    passwordHash: data.passwordHash,
    isActive: true,
    ...data.address,
  };
  return prisma.user.upsert({
    where: { email: data.email },
    update: fields,
    create: { ...fields, email: data.email, cpf: data.cpf, userType: data.userType },
  });
}

async function replaceSubmission(userId: number, audience: 'PATIENT' | 'PSYCHOLOGIST', answers: Answers) {
  const questionnaire = audience === 'PATIENT' ? PATIENT_QUESTIONNAIRE : PSYCHOLOGIST_QUESTIONNAIRE;
  const clean = sanitizeAnswers(questionnaire, answers);
  await prisma.triageSubmission.deleteMany({ where: { userId } });
  await prisma.triageSubmission.create({
    data: {
      userId,
      audience,
      questionnaireVersion: questionnaire.version,
      answers: clean as Prisma.InputJsonValue,
      safetyLevel: audience === 'PATIENT' ? evaluateSafety(clean) : 'NONE',
    },
  });
}

async function main() {
  console.log('Seeding HopeMind demo data (Recife)...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const patientUser = await upsertUser({
    ...DEMO_PATIENT,
    userType: UserType.PATIENT,
    passwordHash,
    address: addressOf(DEMO_PATIENT.place, DEMO_PATIENT.number),
  });
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: { userId: patientUser.id, mainComplaint: 'Ansiedade relacionada ao trabalho.' },
  });
  await replaceSubmission(patientUser.id, 'PATIENT', DEMO_PATIENT.answers);

  for (const [i, p] of PSYCHOLOGISTS.entries()) {
    const user = await upsertUser({
      ...p,
      phone: `8199${String(1000000 + i * 7919).slice(-7)}`,
      userType: UserType.PSYCHOLOGIST,
      passwordHash,
      address: addressOf(p.place, p.number),
    });
    const profile = {
      crp: p.crp,
      specialty: p.specialty,
      therapeuticApproach: p.approach,
      biography: p.biography,
      sessionFee: p.fee,
      contactLink: null,
    };
    await prisma.psychologist.upsert({
      where: { userId: user.id },
      update: profile,
      create: { ...profile, userId: user.id },
    });
    await replaceSubmission(user.id, 'PSYCHOLOGIST', psychologistAnswers(p));
  }

  console.log('Seed completed.');
  console.log(`  Paciente demo:  ${DEMO_PATIENT.email} / ${DEMO_PASSWORD} (Graças, Recife)`);
  console.log(`  Psicólogo demo: ${PSYCHOLOGISTS[0].email} / ${DEMO_PASSWORD} (+${PSYCHOLOGISTS.length - 1} perfis em Recife)`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
