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

    const options = await this.prisma.triageOption.findMany({
      where: { id: { in: respostas.map((r) => Number(r.idOpcao)) } },
    });
    const optionById = new Map(options.map((o) => [o.id, o]));

    for (const r of respostas) {
      const option = optionById.get(Number(r.idOpcao));
      if (!option || option.questionId !== Number(r.idPergunta)) {
        throw new BadRequestException('Resposta inválida para a pergunta informada.');
      }
    }

    const tagIds = Array.from(new Set(options.map((o) => o.tagId).filter((id): id is number => id !== null)));

    // A new submission replaces the previous profile instead of piling up on top of it.
    await this.prisma.$transaction(async (tx) => {
      if (user.patient) {
        const patientId = user.patient.id;
        await tx.patientAnswer.deleteMany({ where: { patientId } });
        await tx.patientTag.deleteMany({ where: { patientId } });
        await tx.patientAnswer.createMany({
          data: respostas.map((r) => ({ patientId, questionId: Number(r.idPergunta), optionId: Number(r.idOpcao) })),
        });
        await tx.patientTag.createMany({ data: tagIds.map((tagId) => ({ patientId, tagId })) });
      } else if (user.psychologist) {
        const psychologistId = user.psychologist.id;
        await tx.psychologistAnswer.deleteMany({ where: { psychologistId } });
        await tx.psychologistTag.deleteMany({ where: { psychologistId } });
        await tx.psychologistAnswer.createMany({
          data: respostas.map((r) => ({ psychologistId, questionId: Number(r.idPergunta), optionId: Number(r.idOpcao) })),
        });
        await tx.psychologistTag.createMany({ data: tagIds.map((tagId) => ({ psychologistId, tagId })) });
      }
    });

    return {
      message: 'Triagem enviada com sucesso.',
      tags: tagIds,
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
