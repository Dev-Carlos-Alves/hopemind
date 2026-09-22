import { PrismaClient, UserType, TargetAudience } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HopeMind seed process...');

  // 1. Create Tags
  const tagAnxiety = await prisma.tag.upsert({
    where: { code: 'TAG_ANXIETY' },
    update: {},
    create: { code: 'TAG_ANXIETY', name: 'Ansiedade e Pânico', category: 'queixa' },
  });

  const tagDepression = await prisma.tag.upsert({
    where: { code: 'TAG_DEPRESSION' },
    update: {},
    create: { code: 'TAG_DEPRESSION', name: 'Depressão e Desânimo', category: 'queixa' },
  });

  const tagStress = await prisma.tag.upsert({
    where: { code: 'TAG_STRESS' },
    update: {},
    create: { code: 'TAG_STRESS', name: 'Estresse e Burnout', category: 'queixa' },
  });

  const tagCbt = await prisma.tag.upsert({
    where: { code: 'TAG_CBT' },
    update: {},
    create: { code: 'TAG_CBT', name: 'Terapia Cognitivo-Comportamental (TCC)', category: 'abordagem' },
  });

  const tagPsychoanalysis = await prisma.tag.upsert({
    where: { code: 'TAG_PSYCHOANALYSIS' },
    update: {},
    create: { code: 'TAG_PSYCHOANALYSIS', name: 'Psicanálise', category: 'abordagem' },
  });

  // 2. Create Triage Questions & Options
  const q1 = await prisma.triageQuestion.create({
    data: {
      questionText: 'Qual é a sua principal queixa ou objetivo ao buscar atendimento?',
      targetAudience: TargetAudience.PATIENT,
      orderNum: 1,
      options: {
        create: [
          { optionText: 'Sinto ansiedade constante ou crises de pânico', tagId: tagAnxiety.id },
          { optionText: 'Sinto tristeza profunda, falta de motivação ou desânimo', tagId: tagDepression.id },
          { optionText: 'Estou com sobrecarga de trabalho e estresse elevado', tagId: tagStress.id },
        ],
      },
    },
  });

  const q2 = await prisma.triageQuestion.create({
    data: {
      questionText: 'Qual abordagem terapêutica você prefere ou tem mais familiaridade?',
      targetAudience: TargetAudience.BOTH,
      orderNum: 2,
      options: {
        create: [
          { optionText: 'Foco em solução de problemas e pensamentos (TCC)', tagId: tagCbt.id },
          { optionText: 'Foco no autoconhecimento profundo e inconsciente (Psicanálise)', tagId: tagPsychoanalysis.id },
        ],
      },
    },
  });

  // 3. Create Demo Users (Password: hopemind123)
  const passwordHash = await bcrypt.hash('hopemind123', 10);

  // Demo Patient
  const userPatient = await prisma.user.upsert({
    where: { email: 'paciente@hopemind.local' },
    update: {},
    create: {
      email: 'paciente@hopemind.local',
      passwordHash,
      name: 'Ana Souza (Paciente Demo)',
      cpf: '111.222.333-44',
      phone: '(11) 98765-4321',
      birthDate: new Date('1998-05-15'),
      gender: 'Feminino',
      userType: UserType.PATIENT,
      patient: {
        create: {
          mainComplaint: 'Busco ajuda para lidar com ansiedade em relação ao trabalho.',
          patientTags: {
            create: [
              { tagId: tagAnxiety.id },
              { tagId: tagCbt.id },
            ],
          },
        },
      },
    },
  });

  // Demo Psychologist 1 (Rafael Moura)
  const userPsi1 = await prisma.user.upsert({
    where: { email: 'rafael@hopemind.local' },
    update: {},
    create: {
      email: 'rafael@hopemind.local',
      passwordHash,
      name: 'Dr. Rafael Moura',
      cpf: '555.666.777-88',
      phone: '(11) 91234-5678',
      birthDate: new Date('1988-10-20'),
      gender: 'Masculino',
      userType: UserType.PSYCHOLOGIST,
      psychologist: {
        create: {
          crp: 'CRP 06/123456',
          contactLink: 'https://wa.me/5511912345678',
          specialty: 'Terapia Cognitivo-Comportamental',
          therapeuticApproach: 'TCC e Gestalt',
          biography: 'Especialista no tratamento de trancornos de ansiedade, estresse e fobia social com mais de 8 anos de experiência clínica.',
          sessionFee: 150.00,
          psychologistTags: {
            create: [
              { tagId: tagAnxiety.id },
              { tagId: tagCbt.id },
              { tagId: tagStress.id },
            ],
          },
        },
      },
    },
  });

  // Demo Psychologist 2 (Dra. Roberto Silva)
  const userPsi2 = await prisma.user.upsert({
    where: { email: 'roberto@hopemind.local' },
    update: {},
    create: {
      email: 'roberto@hopemind.local',
      passwordHash,
      name: 'Dra. Roberto Silva',
      cpf: '999.888.777-66',
      phone: '(11) 97777-8888',
      birthDate: new Date('1985-03-12'),
      gender: 'Masculino',
      userType: UserType.PSYCHOLOGIST,
      psychologist: {
        create: {
          crp: 'CRP 06/987654',
          contactLink: 'https://wa.me/5511977778888',
          specialty: 'Psicanálise Clínica',
          therapeuticApproach: 'Psicanálise',
          biography: 'Atendimento voltado para autoconhecimento, quadros depressivos e conflitos relacionais.',
          sessionFee: 180.00,
          psychologistTags: {
            create: [
              { tagId: tagDepression.id },
              { tagId: tagPsychoanalysis.id },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('   Demo Patient: paciente@hopemind.local / hopemind123');
  console.log('   Demo Psychologist: rafael@hopemind.local / hopemind123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
