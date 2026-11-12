import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TriageModule } from './triage/triage.module';
import { AppController, HealthController } from './app.controller';
import { AppointmentsModule } from './appointments/appointments.module';
import { GeoModule } from './geo/geo.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 100 req/min per IP. THROTTLE_LIMIT exists only so the k6 load test (single source IP)
    // can run against the homologation environment; production keeps the default.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT) || 100 }]),
    PrismaModule,
    MailModule,
    GeoModule,
    AuthModule,
    TriageModule,
    AppointmentsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
