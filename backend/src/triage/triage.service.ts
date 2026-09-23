import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ALGORITHM_VERSION, findMatches, PsychologistProfile } from './match/match-engine';
import { evaluateSafety, SUPPORT_RESOURCES } from './match/safety';
import { AnswerValidationError, Answers, Audience, questionnaireFor, sanitizeAnswers } from './questionnaire';
import { APPROACHES, labelOf } from './questionnaire/catalog';

interface AuthUser {
  sub: number;
  userType: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
  patientId: number | null;
  psychologistId: number | null;
}

const audienceOf = (user: AuthUser): Audience => {
  if (user.userType === 'PATIENT' || user.userType === 'PSYCHOLOGIST') return user.userType;
  throw new ForbiddenException('Questionário disponível apenas para pacientes e psicólogos.');
};

@Injectable()
export class TriageService {
  constructor(private prisma: PrismaService) {}

  getQuestionnaire(user: AuthUser) {
    return questionnaireFor(audienceOf(user));
  }

  async getMySubmission(user: AuthUser) {
    const submission = await this.latestSubmission(user.sub);
    return submission
      ? { questionnaireVersion: submission.questionnaireVersion, answers: submission.answers, submittedAt: submission.createdAt }
      : null;
  }

  async submit(user: AuthUser, rawAnswers: Record<string, unknown>) {
    const audience = audienceOf(user);
    const questionnaire = questionnaireFor(audience);

    let answers: Answers;
    try {
      answers = sanitizeAnswers(questionnaire, rawAnswers);
    } catch (err) {
      if (err instanceof AnswerValidationError) throw new BadRequestException(err.message);
      throw err;
    }

    const safetyLevel = audience === 'PATIENT' ? evaluateSafety(answers) : 'NONE';

    const submission = await this.prisma.$transaction(async (tx) => {
      const created = await tx.triageSubmission.create({
        data: {
          userId: user.sub,
          audience,
          questionnaireVersion: questionnaire.version,
          answers: answers as Prisma.InputJsonValue,
          safetyLevel,
        },
      });
      if (safetyLevel !== 'NONE' && user.patientId) {
        await tx.safetyAlert.create({
          data: { patientId: user.patientId, submissionId: created.id, level: safetyLevel },
        });
      }
      return created;
    });

    return {
      message: 'Respostas salvas.',
      submissionId: submission.id,
      questionnaireVersion: questionnaire.version,
      safety: this.safetyPayload(safetyLevel),
    };
  }

  async getMatches(user: AuthUser) {
    if (!user.patientId) {
      throw new ForbiddenException('Recomendações disponíveis apenas para pacientes.');
    }

    const [submission, patientUser] = await Promise.all([
      this.latestSubmission(user.sub),
      this.prisma.user.findUnique({ where: { id: user.sub }, select: { birthDate: true } }),
    ]);
    if (!submission) {
      throw new ConflictException('Responda o questionário para receber recomendações.');
    }

    const psychologists = await this.prisma.psychologist.findMany({
      where: { user: { isActive: true } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true,
            triageSubmissions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const profiles: PsychologistProfile[] = psychologists
      .filter((p) => p.user.triageSubmissions.length > 0)
      .map((p) => ({
        id: p.id,
        answers: p.user.triageSubmissions[0].answers as Answers,
        gender: p.user.gender,
        birthDate: p.user.birthDate,
      }));

    const outcome = findMatches(
      { answers: submission.answers as Answers, birthDate: patientUser!.birthDate, safetyLevel: submission.safetyLevel },
      profiles,
    );

    await this.prisma.matchRun.create({
      data: {
        patientId: user.patientId,
        submissionId: submission.id,
        algorithmVersion: ALGORITHM_VERSION,
        questionnaireVersion: submission.questionnaireVersion,
        results: outcome.results.map(({ psychologistId, score, components }) => ({ psychologistId, score, components })),
      },
    });

    const byId = new Map(psychologists.map((p) => [p.id, p]));
    return {
      algorithmVersion: ALGORITHM_VERSION,
      questionnaireVersion: submission.questionnaireVersion,
      safety: this.safetyPayload(submission.safetyLevel),
      evaluated: profiles.length,
      excluded: outcome.excluded,
      results: outcome.results.map((r) => {
        const p = byId.get(r.psychologistId)!;
        const psyAnswers = profiles.find((x) => x.id === p.id)!.answers;
        return {
          ...r,
          psychologist: {
            id: p.id,
            name: p.user.name,
            crp: p.crp,
            specialty: p.specialty,
            approaches: ((psyAnswers.S05 as string[]) ?? []).map((a) => labelOf(APPROACHES, a)),
            biography: p.biography,
            sessionFee: p.sessionFee,
            modalities: (psyAnswers.S14 as string[]) ?? [],
            city: (psyAnswers.S15 as string) || null,
          },
        };
      }),
    };
  }

  private latestSubmission(userId: number) {
    return this.prisma.triageSubmission.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  private safetyPayload(level: string) {
    return { level, resources: level === 'NONE' ? [] : SUPPORT_RESOURCES };
  }
}
