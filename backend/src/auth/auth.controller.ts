import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ACCESS_COOKIE, ACCESS_TTL_MS, REFRESH_COOKIE, REFRESH_TTL_MS, cookieOptions } from './auth.config';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto, RegisterDto } from './dto/auth.dto';

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
    const { accessToken, refreshToken, user } = await this.authService.login(body.email, body.password);
    this.setSessionCookies(response, accessToken, refreshToken);
    return { message: 'Login realizado com sucesso!', user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar o access token a partir do refresh token (cookie)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken } = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    this.setSessionCookies(response, accessToken, refreshToken);
    return { message: 'Sessão renovada.' };
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

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string) {
    response.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TTL_MS));
    response.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_TTL_MS));
  }
}
