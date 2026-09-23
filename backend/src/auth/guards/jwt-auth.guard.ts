import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE, accessSecret } from '../auth.config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let token = request.cookies?.[ACCESS_COOKIE];

    if (!token && request.headers.authorization) {
      const [type, headerToken] = request.headers.authorization.split(' ');
      if (type === 'Bearer') {
        token = headerToken;
      }
    }

    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: accessSecret() });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return true;
  }
}
