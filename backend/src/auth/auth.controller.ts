import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ACCESS_COOKIE, ACCESS_TTL_MS, REFRESH_COOKIE, cookieOptions, refreshTtlMs } from './auth.config';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateAddressDto,
  UpdateProfessionalProfileDto,
} from './dto/auth.dto';

const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário (Paciente ou Psicólogo)' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário e definir cookies httpOnly' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, remember, user } = await this.authService.login(body.login ?? body.email!, body.password, body.remember);
    this.setSessionCookies(response, accessToken, refreshToken, remember);
    return { message: 'Login realizado com sucesso!', user, remember };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Envia um código de 6 dígitos para o e-mail da conta (login por e-mail ou CPF)' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.login);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Redefine a senha com o código recebido por e-mail' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.login, body.code, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar o access token a partir do refresh token (cookie); { remember } liga/desliga "manter conectado"' })
  async refresh(@Req() req: Request, @Body() body: RefreshDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, remember } = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE], body?.remember);
    this.setSessionCookies(response, accessToken, refreshToken, remember);
    return { message: 'Sessão renovada.', remember };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Encerrar sessão e limpar cookies' })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ACCESS_COOKIE, cookieOptions());
    response.clearCookie(REFRESH_COOKIE, cookieOptions());
    return { message: 'Logout realizado com sucesso.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Patch('me/profile')
  @ApiOperation({ summary: 'Psicólogo atualiza especialidade, abordagem, biografia, valor da sessão e link de contato (US-11)' })
  updateProfessionalProfile(@Req() req: any, @Body() body: UpdateProfessionalProfileDto) {
    return this.authService.updateProfessionalProfile(req.user.psychologistId, body);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Patch('me/address')
  @ApiOperation({ summary: 'Atualiza o endereço a partir do CEP (usado na distância do match)' })
  updateAddress(@Req() req: any, @Body() body: UpdateAddressDto) {
    return this.authService.updateAddress(req.user.sub, body);
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string, remember: boolean) {
    response.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TTL_MS));
    response.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshTtlMs(remember)));
  }
}
