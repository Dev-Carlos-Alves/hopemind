import { Body, Controller, ForbiddenException, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('Appointments')
@Controller('api/sessoes')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post('agendar')
  @ApiOperation({ summary: 'Paciente logado agenda uma sessão com um psicólogo' })
  agendarSessao(@Req() req: any, @Body() body: CreateAppointmentDto) {
    const patientId: number | null = req.user.patientId;
    if (!patientId) {
      throw new ForbiddenException('Apenas pacientes podem agendar sessões.');
    }
    return this.appointmentsService.createAppointment(body.idPsicologo, patientId, body.dataHora);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos do usuário logado' })
  getMinhasSessoes(@Req() req: any) {
    return this.appointmentsService.getAppointmentsForUser(req.user.sub);
  }
}
