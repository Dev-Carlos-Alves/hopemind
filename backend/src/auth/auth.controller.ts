import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário (Paciente ou Psicólogo)' })
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário e definir cookies httpOnly' })
  async login(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.email, body.password);

    // Set httpOnly cookies (Modelo Prottus)
    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Login realizado com sucesso!',
      user: result.user,
      token: result.accessToken, // Retornado também para compatibilidade de testes
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Encerrar sessão e limpar cookies' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { message: 'Logout realizado com sucesso.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}
