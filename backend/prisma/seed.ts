import { Prisma, PrismaClient, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Answers, PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE, sanitizeAnswers } from '../src/triage/questionnaire';
import { evaluateSafety } from '../src/triage/match/safety';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'hopemind123';

const slots = (spec: string) => spec.split(/\s+/).filter(Boolean);

interface DemoPsychologist {
  email: string;
  name: string;
  gender: string;
  birthDate: string;
  cpf: string;
  phone: string;
  crp: string;
  specialty: string;
  approach: string;
  fee: number;
  biography: string;
  answers: Answers;
}

// Varied, fictitious profiles so the demo exercises every filter and component of the algorithm.
const PSYCHOLOGISTS: DemoPsychologist[] = [
  {
    email: 'rafael@hopemind.local',
    name: 'Rafael Moura',
    gender: 'Masculino',
    birthDate: '1988-10-20',
    cpf: '55566677788',
    phone: '11912345678',
    crp: 'CRP 06/123456',
    specialty: 'Terapia Cognitivo-Comportamental',
    approach: 'TCC',
    fee: 150,
    biography: 'Trabalho com ansiedade, estresse e questões de carreira usando técnicas práticas e metas combinadas a cada etapa.',
    answers: {
      S01: '5-10', S02: ['adolescentes', 'adultos'], S05: ['tcc', 'act'],
      S03: ['ansiedade', 'estresse', 'trabalho', 'sono', 'habitos'],
      S04: { ansiedade: 5, estresse: 5, trabalho: 4, sono: 3, habitos: 4 },
      S13: [], S06: 5, S07: 5, S08: 4, S09: 4, S10: 2, S11: 5, S12: 4,
      S19: 3, S20: 4, S21: 5, S17: ['objetivos', 'orientacao_pratica'],
      S14: ['online', 'presencial'], S15: 'São Paulo',
      S16: slots('seg-tarde ter-tarde qua-tarde qui-tarde seg-noite ter-noite qui-noite'),
      S18: 'atende_risco',
    },
  },
  {
    email: 'roberto@hopemind.local',
    name: 'Roberto Silva',
    gender: 'Masculino',
    birthDate: '1975-03-12',
    cpf: '99988877766',
    phone: '11977778888',
    crp: 'CRP 06/987654',
    specialty: 'Psicanálise Clínica',
    approach: 'Psicanálise',
    fee: 180,
    biography: 'Atendimento voltado ao autoconhecimento, a quadros depressivos e a conflitos relacionais, no tempo de cada pessoa.',
    answers: {
      S01: '10+', S02: ['adultos', 'idosos'], S05: ['psicanalise'],
      S03: ['humor', 'relacionamentos', 'autoestima', 'luto', 'identidade'],
      S04: { humor: 5, relacionamentos: 5, autoestima: 4, luto: 4, identidade: 3 },
      S13: [], S06: 1, S07: 1, S08: 2, S09: 1, S10: 5, S11: 2, S12: 4,
      S19: 4, S20: 2, S21: 2, S17: ['autoconhecimento', 'exploracao_emocional'],
      S14: ['presencial'], S15: 'São Paulo',
      S16: slots('seg-manha qua-manha sex-manha'),
      S18: 'atende_risco',
    },
  },
  {
    email: 'camila@hopemind.local',
    name: 'Camila Rocha',
    gender: 'Feminino',
    birthDate: '1992-07-08',
    cpf: '22233344455',
    phone: '11955554444',
    crp: 'CRP 06/234567',
    specialty: 'Psicologia Humanista',
    approach: 'Humanista e ACT',
    fee: 140,
    biography: 'Escuta acolhedora para ansiedade, autoestima e questões de identidade e sexualidade, com espaço para você conduzir o ritmo.',
    answers: {
      S01: '3-5', S02: ['adolescentes', 'adultos'], S05: ['humanista', 'act'],
      S03: ['ansiedade', 'autoestima', 'identidade', 'sexualidade', 'relacionamentos'],
      S04: { ansiedade: 4, autoestima: 5, identidade: 5, sexualidade: 4, relacionamentos: 3 },
      S13: [], S06: 2, S07: 3, S08: 3, S09: 2, S10: 3, S11: 4, S12: 5,
      S19: 5, S20: 3, S21: 3, S17: ['reservado', 'autoconhecimento'],
      S14: ['online'],
      S16: slots('ter-noite qui-noite sab-manha sab-tarde'),
      S18: 'atende_risco',
    },
  },
  {
    email: 'felipe@hopemind.local',
    name: 'Felipe Andrade',
    gender: 'Masculino',
    birthDate: '1984-01-30',
    cpf: '33344455566',
    phone: '19988887777',
    crp: 'CRP 06/345678',
    specialty: 'Terapia Comportamental Dialética (DBT)',
    approach: 'DBT e TCC',
    fee: 200,
    biography: 'Foco em regulação emocional, trauma e mudança de hábitos, com plano de tratamento claro e tarefas entre as sessões.',
    answers: {
      S01: '10+', S02: ['adultos'], S05: ['dbt', 'tcc'],
      S03: ['trauma', 'habitos', 'humor', 'sono', 'ansiedade'],
      S04: { trauma: 5, habitos: 5, humor: 4, sono: 4, ansiedade: 3 },
      S13: ['familia'], S06: 4, S07: 5, S08: 5, S09: 5, S10: 2, S11: 5, S12: 3,
      S19: 3, S20: 5, S21: 5, S17: ['objetivos', 'orientacao_pratica'],
      S14: ['online', 'presencial'], S15: 'Campinas',
      S16: slots('seg-tarde qua-tarde sex-tarde'),
      S18: 'atende_risco',
    },
  },
  {
    email: 'juliana@hopemind.local',
    name: 'Juliana Martins',
    gender: 'Feminino',
    birthDate: '1981-11-02',
    cpf: '44455566677',
    phone: '21966665555',
    crp: 'CRP 05/456789',
    specialty: 'Terapia Sistêmica',
    approach: 'Sistêmica',
    fee: 170,
    biography: 'Atendo casais, famílias e adolescentes, olhando para a relação entre as pessoas e não só para o indivíduo.',
    answers: {
      S01: '10+', S02: ['adolescentes', 'adultos', 'casais', 'familias'], S05: ['sistemica'],
      S03: ['familia', 'relacionamentos', 'estudos', 'social'],
      S04: { familia: 5, relacionamentos: 5, estudos: 3, social: 3 },
      S13: ['trauma'], S06: 3, S07: 3, S08: 3, S09: 3, S10: 3, S11: 4, S12: 4,
      S19: 4, S20: 3, S21: 4, S17: ['comunicativo'],
      S14: ['online', 'presencial'], S15: 'Rio de Janeiro',
      S16: slots('seg-manha ter-manha qua-manha seg-tarde'),
      S18: 'encaminha_risco',
    },
  },
  {
    email: 'beatriz@hopemind.local',
    name: 'Beatriz Nogueira',
    gender: 'Feminino',
    birthDate: '1979-05-19',
    cpf: '66677788899',
    phone: '11944443333',
    crp: 'CRP 06/567890',
    specialty: 'Trauma e Luto',
    approach: 'EMDR e Terapia do Esquema',
    fee: 220,
    biography: 'Especializada em trauma, luto e ansiedade, com um cuidado especial para que você se sinta seguro em cada sessão.',
    answers: {
      S01: '10+', S02: ['adultos', 'idosos'], S05: ['emdr', 'esquema'],
      S03: ['trauma', 'luto', 'ansiedade', 'humor'],
      S04: { trauma: 5, luto: 5, ansiedade: 4, humor: 3 },
      S13: [], S06: 3, S07: 2, S08: 3, S09: 3, S10: 4, S11: 3, S12: 4,
      S19: 5, S20: 3, S21: 3, S17: ['reservado', 'exploracao_emocional'],
      S14: ['online'],
      S16: slots('ter-tarde qua-tarde qui-noite'),
      S18: 'atende_risco',
    },
  },
  {
    email: 'thiago@hopemind.local',
    name: 'Thiago Lima',
    gender: 'Masculino',
    birthDate: '1995-09-14',
    cpf: '77788899900',
    phone: '11933332222',
    crp: 'CRP 06/678901',
    specialty: 'Psicologia Psicodinâmica',
    approach: 'Psicodinâmica',
    fee: 120,
    biography: 'Atendo jovens adultos em questões de carreira, estudos, autoestima e relações sociais, sempre online e à noite.',
    answers: {
      S01: '1-3', S02: ['adultos'], S05: ['psicodinamica'],
      S03: ['trabalho', 'estudos', 'autoestima', 'social', 'ansiedade'],
      S04: { trabalho: 4, estudos: 5, autoestima: 4, social: 4, ansiedade: 3 },
      S13: ['trauma'], S06: 2, S07: 2, S08: 3, S09: 2, S10: 4, S11: 3, S12: 5,
      S19: 4, S20: 2, S21: 3, S17: ['comunicativo', 'autoconhecimento'],
      S14: ['online'],
      S16: slots('seg-noite qua-noite qui-noite sex-noite'),
      S18: 'encaminha_risco',
    },
  },
];

const DEMO_PATIENT = {
  email: 'paciente@hopemind.local',
  name: 'Ana Souza',
  gender: 'Feminino',
  birthDate: '1998-05-15',
  cpf: '11122233344',
  phone: '11987654321',
  answers: {
    P01: ['ansiedade', 'trabalho', 'estresse'], P02: ['emocoes', 'sintomas', 'comportamentos'],
    P19: ['ansiedade', 'trabalho', 'sono'],
    P03: 5, P04: 3, P05: 4, P06: 2, P07: 4, P08: 2, P09: 5,
    P10: 4, P11: 4, P15: 3, P16: 'perguntar_suavemente', P29: 4,
    P12: 'profissional_acolhedora', P28: 4, P30: 5, P13: 5, P14: 5,
    P17: 'sem_preferencia', P18: ['sem_preferencia'],
    P20: 'online', P21: 'semanal', P22: slots('ter-noite qui-noite qua-tarde sab-manha'),
    P23: 'anteriormente', P24: 3, P25: 'Quero sair das sessões com algo prático para testar na semana.',
    P26: 'nao', P27: 'nao',
  } as Answers,
};

async function upsertUser(data: {
  email: string;
  name: string;
  gender: string;
  birthDate: string;
  cpf: string;
  phone: string;
  userType: UserType;
  passwordHash: string;
}) {
  const fields = {
    name: data.name,
    gender: data.gender,
    birthDate: new Date(data.birthDate),
    phone: data.phone,
    passwordHash: data.passwordHash,
    isActive: true,
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
  console.log('Seeding HopeMind demo data...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const patientUser = await upsertUser({ ...DEMO_PATIENT, userType: UserType.PATIENT, passwordHash });
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: { userId: patientUser.id, mainComplaint: 'Ansiedade relacionada ao trabalho.' },
  });
  await replaceSubmission(patientUser.id, 'PATIENT', DEMO_PATIENT.answers);

  for (const p of PSYCHOLOGISTS) {
    const user = await upsertUser({ ...p, userType: UserType.PSYCHOLOGIST, passwordHash });
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
    await replaceSubmission(user.id, 'PSYCHOLOGIST', p.answers);
  }

  console.log('Seed completed.');
  console.log(`  Paciente demo:  ${DEMO_PATIENT.email} / ${DEMO_PASSWORD}`);
  console.log(`  Psicólogo demo: ${PSYCHOLOGISTS[0].email} / ${DEMO_PASSWORD} (+${PSYCHOLOGISTS.length - 1} perfis)`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
