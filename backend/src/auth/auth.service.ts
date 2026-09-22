import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const {
      email,
      password,
      name,
      cpf,
      phone,
      birthDate,
      gender,
      userType,
      // Patient fields
      mainComplaint,
      // Psychologist fields
      crp,
      contactLink,
      specialty,
      therapeuticApproach,
      biography,
      sessionFee,
    } = data;

    if (!email || !password || !name || !cpf || !userType) {
      throw new BadRequestException('Preencha todos os campos obrigatórios.');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { cpf }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('E-mail ou CPF já cadastrados no sistema.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedBirthDate = birthDate ? new Date(birthDate) : new Date('2000-01-01');

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        cpf,
        phone: phone || '',
        birthDate: parsedBirthDate,
        gender: gender || 'Não informado',
        userType: userType === 'PSYCHOLOGIST' ? UserType.PSYCHOLOGIST : UserType.PATIENT,
        patient:
          userType !== 'PSYCHOLOGIST'
            ? {
                create: {
                  mainComplaint: mainComplaint || '',
                },
              }
            : undefined,
        psychologist:
          userType === 'PSYCHOLOGIST'
            ? {
                create: {
                  crp: crp || `CRP 00/${Math.floor(Math.random() * 900000 + 100000)}`,
                  contactLink: contactLink || '',
                  specialty: specialty || 'Psicologia Clínica',
                  therapeuticApproach: therapeuticApproach || 'Geral',
                  biography: biography || '',
                  sessionFee: sessionFee ? Number(sessionFee) : 150.0,
                },
              }
            : undefined,
      },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    return {
      message: 'Cadastro realizado com sucesso!',
      userId: user.id,
    };
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas ou conta inativa.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    let hasTriage = false;
    let patientId = user.patient?.id || null;
    let psychologistId = user.psychologist?.id || null;

    if (patientId) {
      const answers = await this.prisma.patientAnswer.findFirst({
        where: { patientId },
      });
      if (answers) hasTriage = true;
    } else if (psychologistId) {
      const answers = await this.prisma.psychologistAnswer.findFirst({
        where: { psychologistId },
      });
      if (answers) hasTriage = true;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      patientId,
      psychologistId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'hopemind-access-secret-key-2026-prottus',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'hopemind-refresh-secret-key-2026-prottus',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        patientId,
        psychologistId,
        hasTriage,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        birthDate: true,
        gender: true,
        userType: true,
        patient: true,
        psychologist: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return user;
  }
}
