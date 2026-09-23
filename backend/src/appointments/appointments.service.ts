import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        psychologist: { include: { user: { select: { name: true, email: true, phone: true } } } },
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    return appointments.map((a) => ({
      id: a.id,
      dataHora: a.appointmentDate,
      status: a.status,
      psicologoNome: a.psychologist.user.name,
      pacienteNome: a.patient.user.name,
      especialidade: a.psychologist.specialty,
      crp: a.psychologist.crp,
    }));
  }
}
