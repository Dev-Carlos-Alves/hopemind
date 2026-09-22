import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TriageService {
  constructor(private prisma: PrismaService) {}

  async getQuestions(type?: string) {
    const targetAudience = type === 'PSYCHOLOGIST' ? 'PSYCHOLOGIST' : type === 'PATIENT' ? 'PATIENT' : undefined;

    const questions = await this.prisma.triageQuestion.findMany({
      where: targetAudience
        ? {
            OR: [{ targetAudience: 'BOTH' }, { targetAudience: targetAudience as any }],
          }
        : undefined,
      include: {
        options: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { orderNum: 'asc' },
    });

    return questions.map((q) => ({
      idPergunta: q.id,
      textoPergunta: q.questionText,
      opcoes: q.options.map((o) => ({
        idOpcao: o.id,
        idPergunta: o.questionId,
        idTag: o.tagId,
        textoOpcao: o.optionText,
      })),
    }));
  }

  async submitTriage(userId: number, type: string, respostas: Array<{ idPergunta: number; idOpcao: number }>) {
    if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
      throw new BadRequestException('Respostas de triagem não fornecidas.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, psychologist: true },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const tagIds = new Set<number>();

    for (const r of respostas) {
      const option = await this.prisma.triageOption.findUnique({
        where: { id: r.idOpcao },
      });

      if (option && option.tagId) {
        tagIds.add(option.tagId);
      }

      if (user.patient) {
        await this.prisma.patientAnswer.create({
          data: {
            patientId: user.patient.id,
            questionId: r.idPergunta,
            optionId: r.idOpcao,
          },
        });
      } else if (user.psychologist) {
        await this.prisma.psychologistAnswer.create({
          data: {
            psychologistId: user.psychologist.id,
            questionId: r.idPergunta,
            optionId: r.idOpcao,
          },
        });
      }
    }

    // Link Tags to Patient or Psychologist
    for (const tagId of Array.from(tagIds)) {
      if (user.patient) {
        await this.prisma.patientTag.upsert({
          where: {
            patientId_tagId: { patientId: user.patient.id, tagId },
          },
          update: {},
          create: { patientId: user.patient.id, tagId },
        });
      } else if (user.psychologist) {
        await this.prisma.psychologistTag.upsert({
          where: {
            psychologistId_tagId: { psychologistId: user.psychologist.id, tagId },
          },
          update: {},
          create: { psychologistId: user.psychologist.id, tagId },
        });
      }
    }

    return {
      message: 'Triagem enviada com sucesso.',
      tags: Array.from(tagIds),
    };
  }

  async getMatches(patientId: number) {
    const patientTags = await this.prisma.patientTag.findMany({
      where: { patientId },
      select: { tagId: true },
    });

    const patientTagIds = new Set(patientTags.map((pt) => pt.tagId));
    if (patientTagIds.size === 0) {
      return [];
    }

    const psychologists = await this.prisma.psychologist.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        psychologistTags: { select: { tagId: true } },
      },
    });

    const totalPatientNeeds = patientTagIds.size;
    const results = [];

    for (const psi of psychologists) {
      const psiTagIds = new Set(psi.psychologistTags.map((pt) => pt.tagId));
      let intersectionCount = 0;

      for (const tagId of Array.from(patientTagIds)) {
        if (psiTagIds.has(tagId)) {
          intersectionCount++;
        }
      }

      const matchPercentage = Math.round((intersectionCount / totalPatientNeeds) * 100);

      results.push({
        idPsicologo: psi.id,
        nome: psi.user.name,
        especialidade: psi.specialty,
        crp: psi.crp,
        linkContato: psi.contactLink,
        valorSessao: psi.sessionFee,
        biografia: psi.biography,
        matchPercentage,
        foto: 'assets/images/perfil-rafael.png',
      });
    }

    results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    return results;
  }
}
