import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ageAt } from '../triage/match/match-engine';
import { answerLabels, Answers, PATIENT_QUESTIONNAIRE } from '../triage/questionnaire';

const SESSION_MINUTES = 50;

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(psychologistId: number, patientId: number, appointmentDate: string) {
    const parsedDate = new Date(appointmentDate);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Data e hora inválidas.');
    }

    if (parsedDate < new Date()) {
      throw new BadRequestException('Não é permitido agendar sessões no passado.');
    }

    const psychologist = await this.prisma.psychologist.findUnique({ where: { id: psychologistId } });
    if (!psychologist) {
      throw new NotFoundException('Psicólogo não encontrado.');
    }

    const windowStart = new Date(parsedDate.getTime() - SESSION_MINUTES * 60_000 + 1);
    const windowEnd = new Date(parsedDate.getTime() + SESSION_MINUTES * 60_000 - 1);
    const clash = await this.prisma.appointment.findFirst({
      where: {
        status: 'SCHEDULED',
        appointmentDate: { gte: windowStart, lte: windowEnd },
        OR: [{ psychologistId }, { patientId }],
      },
    });
    if (clash) {
      throw new ConflictException(
        clash.psychologistId === psychologistId
          ? 'O profissional já tem uma sessão nesse horário. Escolha outro horário.'
          : 'Você já tem uma sessão marcada nesse horário.',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId,
        patientId,
        appointmentDate: parsedDate,
        status: 'SCHEDULED',
      },
    });

    return {
      message: 'Agendado com sucesso',
      appointmentId: appointment.id,
    };
  }

  async getAppointmentsForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, psychologist: true },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    let whereClause = {};
    if (user.patient) {
      whereClause = { patientId: user.patient.id };
    } else if (user.psychologist) {
      whereClause = { psychologistId: user.psychologist.id };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        psychologist: { include: { user: { select: { name: true, email: true, phone: true, neighborhood: true, city: true } } } },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                birthDate: true,
                gender: true,
                neighborhood: true,
                city: true,
                triageSubmissions: { orderBy: { createdAt: 'desc' }, take: 1, select: { answers: true } },
              },
            },
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    const viewerIsPsychologist = !!user.psychologist;
    return appointments.map((a) => ({
      id: a.id,
      dataHora: a.appointmentDate,
      status: a.status,
      psicologoNome: a.psychologist.user.name,
      pacienteNome: a.patient.user.name,
      especialidade: a.psychologist.specialty,
      crp: a.psychologist.crp,
      // Detailed profile of the other person, opened by tapping the name. Each side only sees
      // the people it has a session with (the list is already filtered by the logged-in user).
      ...(viewerIsPsychologist ? { paciente: this.patientProfile(a.patient) } : { psicologo: this.psychologistProfile(a.psychologist) }),
    }));
  }

  private patientProfile(p: {
    mainComplaint: string | null;
    user: { name: string; birthDate: Date; gender: string; neighborhood: string | null; city: string | null; triageSubmissions: { answers: unknown }[] };
  }) {
    const answers = (p.user.triageSubmissions[0]?.answers ?? null) as Answers | null;
    return {
      nome: p.user.name,
      idade: ageAt(p.user.birthDate),
      genero: p.user.gender,
      sobre: p.mainComplaint,
      prioridades: answerLabels(PATIENT_QUESTIONNAIRE, answers, 'P01'),
      outrosTemas: answerLabels(PATIENT_QUESTIONNAIRE, answers, 'P19'),
      modalidade: answerLabels(PATIENT_QUESTIONNAIRE, answers, 'P20')[0] ?? null,
      bairro: p.user.neighborhood,
      cidade: p.user.city,
    };
  }

  private psychologistProfile(p: {
    id: number;
    crp: string;
    specialty: string;
    therapeuticApproach: string;
    biography: string | null;
    sessionFee: unknown;
    contactLink: string | null;
    user: { name: string; neighborhood: string | null; city: string | null };
  }) {
    return {
      id: p.id,
      nome: p.user.name,
      crp: p.crp,
      especialidade: p.specialty,
      abordagem: p.therapeuticApproach,
      biografia: p.biography,
      valorSessao: p.sessionFee,
      contato: p.contactLink,
      bairro: p.user.neighborhood,
      cidade: p.user.city,
    };
  }
}
