import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('api/sessoes')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post('agendar')
  @ApiOperation({ summary: 'Agendar uma sessão entre Paciente e Psicólogo' })
  async agendarSessao(@Body() body: any) {
    const { idPsicologo, idPaciente, dataHora } = body;
    return this.appointmentsService.createAppointment(
      Number(idPsicologo),
      Number(idPaciente),
      dataHora,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos do usuário logado' })
  async getMinhasSessoes(@Req() req: any) {
    return this.appointmentsService.getAppointmentsForUser(req.user.sub);
  }
}
