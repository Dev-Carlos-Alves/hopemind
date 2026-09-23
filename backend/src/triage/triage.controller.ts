import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmitTriageDto } from './dto/submit-triage.dto';
import { TriageService } from './triage.service';

@ApiTags('Triage & Match')
@Controller('api')
export class TriageController {
  constructor(private triageService: TriageService) {}

  @Get('triage/questionnaire')
  @ApiOperation({ summary: 'Questionário (paciente ou psicólogo) conforme o perfil logado' })
  getQuestionnaire(@Req() req: any) {
    return this.triageService.getQuestionnaire(req.user);
  }

  @Get('triage/me')
  @ApiOperation({ summary: 'Últimas respostas do usuário logado (para revisar o questionário)' })
  getMine(@Req() req: any) {
    return this.triageService.getMySubmission(req.user);
  }

  @Post('triage/submissions')
  @ApiOperation({ summary: 'Enviar respostas; avalia o fluxo de segurança do paciente' })
  submit(@Req() req: any, @Body() body: SubmitTriageDto) {
    return this.triageService.submit(req.user, body.answers);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Recomendações do paciente logado, com razões explicáveis' })
  getMatches(@Req() req: any) {
    return this.triageService.getMatches(req.user);
  }
}
