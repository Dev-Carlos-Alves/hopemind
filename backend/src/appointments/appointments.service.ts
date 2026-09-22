import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId,
        patientId,
        appointmentDate: parsedDate,
        status: 'SCHEDULED',
      },
      include: {
        psychologist: { include: { user: true } },
        patient: { include: { user: true } },
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
