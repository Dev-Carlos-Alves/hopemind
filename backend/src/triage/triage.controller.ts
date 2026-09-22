import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { TriageService } from './triage.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Triage & Match')
@Controller()
export class TriageController {
  constructor(private triageService: TriageService) {}

  @Get('api/triage/questions')
  @ApiOperation({ summary: 'Obter perguntas da triagem' })
  async getQuestions(@Query('tipo') tipo?: string) {
    return this.triageService.getQuestions(tipo);
  }

  @Post('api/triage/submit')
  @ApiOperation({ summary: 'Submeter respostas de triagem' })
  async submitTriage(@Req() req: any, @Body() body: any) {
    return this.triageService.submitTriage(req.user.sub, body.tipo, body.respostas);
  }

  @Get('api/matches/:pacienteId')
  @ApiOperation({ summary: 'Obter recomendação de psicólogos com % de Match para um paciente' })
  async getMatches(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.triageService.getMatches(pacienteId);
  }
}
