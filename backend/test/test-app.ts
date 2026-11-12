import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CepAddress, CepService } from '../src/geo/cep.service';
import { MailService, OutgoingMail } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Location } from '../src/triage/match/match-engine';
import { PATIENT_QUESTIONNAIRE, PSYCHOLOGIST_QUESTIONNAIRE } from '../src/triage/questionnaire';
import { ADULT_BIRTH, GRACAS, patientAnswers, psyAnswers } from '../src/testing/fixtures';
import { FakePrisma } from './fake-prisma';

export const PASSWORD = 'SenhaForte123';

/** CEPs the fake CEP service knows; anything else is "not found". */
export const KNOWN_CEPS: Record<string, CepAddress> = {
  '52050000': { cep: '52050-000', street: 'Rua das Graças', neighborhood: 'Graças', city: 'Recife', state: 'PE', latitude: -8.04517, longitude: -34.90077, precision: 'bairro' },
};

export class FakeCepService {
  async lookup(raw: string): Promise<CepAddress> {
    const digits = (raw ?? '').replace(/\D/g, '');
    const { BadRequestException, NotFoundException } = await import('@nestjs/common');
    if (digits.length !== 8) throw new BadRequestException('Informe um CEP com 8 dígitos.');
    const hit = KNOWN_CEPS[digits];
    if (!hit) throw new NotFoundException('CEP não encontrado.');
    return hit;
  }
}

/** Keeps the e-mails the API would send, so tests can read the reset code. */
export class FakeMailService {
  sent: OutgoingMail[] = [];
  configured = true;
  async send(mail: OutgoingMail) {
    this.sent.push(mail);
    return true;
  }
}

export interface TestApp {
  app: INestApplication;
  prisma: FakePrisma;
  mail: FakeMailService;
  http: () => request.SuperTest<request.Test>;
  /** Clears the database and the rate-limit counters. */
  reset: () => void;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const prisma = new FakePrisma();
  const mail = new FakeMailService();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(CepService)
    .useValue(new FakeCepService())
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  const storage = app.get(ThrottlerStorage) as unknown as { storage: Record<string, unknown> };
  const reset = () => {
    prisma.reset();
    mail.sent = [];
    for (const k of Object.keys(storage.storage)) delete storage.storage[k];
  };

  return { app, prisma, mail, http: () => request(app.getHttpServer()), reset, close: () => app.close() };
}

/* ───── seeding (direct inserts, like the Prisma seed script) ───── */

let seq = 0;
const hash = bcrypt.hashSync(PASSWORD, 4);

interface SeedOptions {
  name?: string;
  email?: string;
  location?: Location | null;
  isActive?: boolean;
}

function seedUser(prisma: FakePrisma, userType: 'PATIENT' | 'PSYCHOLOGIST', opts: SeedOptions) {
  seq++;
  const loc = opts.location === undefined ? GRACAS : opts.location;
  return prisma.insert('user', {
    email: opts.email ?? `${userType.toLowerCase()}${seq}@teste.dev`,
    passwordHash: hash,
    name: opts.name ?? `${userType === 'PATIENT' ? 'Paciente' : 'Psicóloga'} Sintética ${seq}`,
    cpf: String(10000000000 + seq),
    phone: '81999990000',
    birthDate: userType === 'PATIENT' ? ADULT_BIRTH : new Date('1985-01-01'),
    gender: 'Feminino',
    userType,
    isActive: opts.isActive ?? true,
    ...(loc ?? {}),
  });
}

export function seedPatient(prisma: FakePrisma, opts: SeedOptions & { answers?: Record<string, unknown> | null; safetyLevel?: string } = {}) {
  const user = seedUser(prisma, 'PATIENT', opts);
  const patient = prisma.insert('patient', { userId: user.id });
  if (opts.answers !== null) {
    prisma.insert('triageSubmission', {
      userId: user.id,
      audience: 'PATIENT',
      questionnaireVersion: PATIENT_QUESTIONNAIRE.version,
      answers: opts.answers ?? patientAnswers(),
      safetyLevel: opts.safetyLevel ?? 'NONE',
    });
  }
  return { user, patient };
}

export function seedPsychologist(prisma: FakePrisma, opts: SeedOptions & { answers?: Record<string, unknown> | null; crp?: string } = {}) {
  const user = seedUser(prisma, 'PSYCHOLOGIST', opts);
  const psychologist = prisma.insert('psychologist', {
    userId: user.id,
    crp: opts.crp ?? `CRP 02/${String(10000 + seq)}`,
    specialty: 'Psicologia clínica',
    therapeuticApproach: 'TCC',
    contactLink: 'https://wa.me/5581999990000',
    sessionFee: 150,
  });
  if (opts.answers !== null) {
    prisma.insert('triageSubmission', {
      userId: user.id,
      audience: 'PSYCHOLOGIST',
      questionnaireVersion: PSYCHOLOGIST_QUESTIONNAIRE.version,
      answers: opts.answers ?? psyAnswers(),
    });
  }
  return { user, psychologist };
}

/** Logs in through the real endpoint and returns an agent that keeps the session cookies. */
export async function loginAs(t: TestApp, email: string, password = PASSWORD) {
  const agent = request.agent(t.app.getHttpServer());
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login falhou (${res.status}): ${JSON.stringify(res.body)}`);
  return agent;
}

export const cookiesOf = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'] as unknown;
  return Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
};
