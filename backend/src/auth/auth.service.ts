import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { accessSecret, refreshSecret } from './auth.config';
import { RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  userType: UserType;
  patientId: number | null;
  psychologistId: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
    });
    if (existingUser) {
      throw new BadRequestException('E-mail ou CPF já cadastrados no sistema.');
    }

    const isPsychologist = data.userType === 'PSYCHOLOGIST';

    if (isPsychologist) {
      const crpInUse = await this.prisma.psychologist.findUnique({ where: { crp: data.crp.toUpperCase() } });
      if (crpInUse) {
        throw new BadRequestException('Este CRP já está cadastrado.');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 10),
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        birthDate: new Date(data.birthDate),
        gender: data.gender || 'Não informado',
        userType: isPsychologist ? UserType.PSYCHOLOGIST : UserType.PATIENT,
        patient: isPsychologist ? undefined : { create: { mainComplaint: data.mainComplaint || null } },
        psychologist: isPsychologist
          ? {
              create: {
                crp: data.crp.toUpperCase(),
                specialty: data.specialty,
                therapeuticApproach: data.therapeuticApproach || data.specialty,
                biography: data.biography || null,
                contactLink: data.contactLink || null,
                sessionFee: data.sessionFee ?? 0,
              },
            }
          : undefined,
      },
    });

    return { message: 'Cadastro realizado com sucesso!', userId: user.id };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { patient: true, psychologist: true },
    });

    const valid = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      patientId: user.patient?.id ?? null,
      psychologistId: user.psychologist?.id ?? null,
    };

    return {
      ...(await this.issueTokens(payload)),
      user: { ...this.publicUser(payload), hasTriage: await this.hasTriage(user.id) },
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Sessão expirada.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret: refreshSecret() });
    } catch {
      throw new UnauthorizedException('Sessão expirada.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { patient: true, psychologist: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sessão expirada.');
    }

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      patientId: user.patient?.id ?? null,
      psychologistId: user.psychologist?.id ?? null,
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        gender: true,
        userType: true,
        patient: { select: { id: true, mainComplaint: true } },
        psychologist: {
          select: {
            id: true,
            crp: true,
            specialty: true,
            therapeuticApproach: true,
            biography: true,
            sessionFee: true,
            contactLink: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return { ...user, hasTriage: await this.hasTriage(user.id) };
  }

  private async issueTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, { secret: accessSecret(), expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync(payload, { secret: refreshSecret(), expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  private publicUser(p: JwtPayload) {
    return {
      id: p.sub,
      name: p.name,
      email: p.email,
      userType: p.userType,
      patientId: p.patientId,
      psychologistId: p.psychologistId,
    };
  }

  private async hasTriage(userId: number) {
    return !!(await this.prisma.triageSubmission.findFirst({ where: { userId }, select: { id: true } }));
  }
}
