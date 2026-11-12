import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { CepService } from '../geo/cep.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { accessSecret, refreshSecret } from './auth.config';
import { RegisterDto, UpdateAddressDto, UpdateProfessionalProfileDto } from './dto/auth.dto';

const ADDRESS_FIELDS = {
  cep: true,
  street: true,
  addressNumber: true,
  neighborhood: true,
  city: true,
  state: true,
  latitude: true,
  longitude: true,
} as const;

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  userType: UserType;
  patientId: number | null;
  psychologistId: number | null;
  /** "Manter conectado": refresh token de 30 dias em vez de 7. */
  remember?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private cepService: CepService,
    private mail: MailService,
  ) {}

  /* ───────────── Esqueci minha senha ───────────── */

  static readonly RESET_TTL_MS = 15 * 60 * 1000;
  static readonly RESET_MAX_ATTEMPTS = 5;
  /** Same answer whether or not the account exists, so the endpoint can't be used to find accounts. */
  static readonly RESET_REQUESTED = 'Se houver uma conta com esses dados, enviamos um código de 6 dígitos para o e-mail cadastrado. Ele vale por 15 minutos.';

  async requestPasswordReset(login: string) {
    const user = await this.findByLogin(login);
    if (user && user.isActive) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      // A new code replaces any previous one still waiting to be used.
      await this.prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      await this.prisma.passwordReset.create({
        data: { userId: user.id, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + AuthService.RESET_TTL_MS) },
      });
      // Sent in the background: the answer comes back right away (and takes the same time
      // whether or not the account exists). MailService.send never throws.
      void this.mail.send({
        to: user.email,
        subject: 'HopeMind — código para redefinir sua senha',
        text:
          `Olá, ${user.name.split(' ')[0]}!\n\nSeu código para redefinir a senha do HopeMind é ${code}.\n` +
          'Ele vale por 15 minutos e só pode ser usado uma vez.\n\n' +
          'Se não foi você quem pediu, ignore este e-mail: sua senha continua a mesma.',
      });
    }
    return { message: AuthService.RESET_REQUESTED };
  }

  async resetPassword(login: string, code: string, password: string) {
    const invalid = new BadRequestException('Código inválido ou expirado. Peça um novo código.');
    const user = await this.findByLogin(login);
    if (!user || !user.isActive) throw invalid;

    const reset = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset || reset.expiresAt < new Date() || reset.attempts >= AuthService.RESET_MAX_ATTEMPTS) throw invalid;

    if (!(await bcrypt.compare(code, reset.codeHash))) {
      await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: reset.attempts + 1 } });
      throw invalid;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
      await tx.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
    });
    return { message: 'Senha redefinida. Entre com a nova senha.' };
  }

  /** Coordinates are always resolved on the server; the client only sends the CEP. */
  private async resolveAddress(cep: string, addressNumber?: string) {
    const a = await this.cepService.lookup(cep);
    return {
      cep: a.cep,
      street: a.street,
      addressNumber: addressNumber || null,
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      latitude: a.latitude,
      longitude: a.longitude,
    };
  }

  async updateAddress(userId: number, data: UpdateAddressDto) {
    const address = await this.resolveAddress(data.cep, data.addressNumber);
    return this.prisma.user.update({ where: { id: userId }, data: address, select: ADDRESS_FIELDS });
  }

  /** US-11: atualiza o perfil profissional do psicólogo logado (o ID vem do token, nunca do cliente). */
  async updateProfessionalProfile(psychologistId: number | null, data: UpdateProfessionalProfileDto) {
    if (!psychologistId) {
      throw new ForbiddenException('Somente psicólogos têm perfil profissional.');
    }
    const changes = {
      ...(data.specialty !== undefined && { specialty: data.specialty }),
      ...(data.therapeuticApproach !== undefined && { therapeuticApproach: data.therapeuticApproach }),
      ...(data.biography !== undefined && { biography: data.biography || null }),
      ...(data.sessionFee !== undefined && { sessionFee: data.sessionFee }),
      ...(data.contactLink !== undefined && { contactLink: data.contactLink || null }),
    };
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Envie ao menos um campo para atualizar.');
    }
    return this.prisma.psychologist.update({
      where: { id: psychologistId },
      data: changes,
      select: { id: true, crp: true, specialty: true, therapeuticApproach: true, biography: true, sessionFee: true, contactLink: true },
    });
  }

  async register(data: RegisterDto) {
    // E-mails são gravados em minúsculas; no PostgreSQL a comparação diferencia maiúsculas.
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email.toLowerCase() }, { cpf: data.cpf }] },
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

    const address = data.cep ? await this.resolveAddress(data.cep, data.addressNumber) : {};

    const user = await this.prisma.user.create({
      data: {
        ...address,
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

  /** Finds the account by e-mail or CPF (any mask). Returns null for anything else. */
  private findByLogin(login: string) {
    const value = (login ?? '').trim();
    const digits = value.replace(/\D/g, '');
    const where = value.includes('@') ? { email: value.toLowerCase() } : digits.length === 11 ? { cpf: digits } : null;
    if (!where) return null;
    return this.prisma.user.findUnique({ where, include: { patient: true, psychologist: true } });
  }

  async login(login: string, password: string, remember = false) {
    const user = await this.findByLogin(login);

    const valid = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) {
      throw new UnauthorizedException('E-mail, CPF ou senha incorretos.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      patientId: user.patient?.id ?? null,
      psychologistId: user.psychologist?.id ?? null,
      remember,
    };

    return {
      ...(await this.issueTokens(payload)),
      user: { ...this.publicUser(payload), hasTriage: await this.hasTriage(user.id) },
    };
  }

  /** Renova a sessão; `remember` troca a escolha de "manter conectado" (omitido = mantém a do token). */
  async refresh(refreshToken: string | undefined, remember?: boolean) {
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
      remember: remember ?? payload.remember ?? false,
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
        ...ADDRESS_FIELDS,
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
    const refreshToken = await this.jwtService.signAsync(payload, { secret: refreshSecret(), expiresIn: payload.remember ? '30d' : '7d' });
    return { accessToken, refreshToken, remember: !!payload.remember };
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
