import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession, SessionSchema } from './schemas/session.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserServiceClient } from './user-service.client';
import { USER_SERVICE_NATS_CLIENT } from './user-service.nats';
import type { StringValue } from 'ms';

function parseExpiresIn(
  raw: string | undefined,
  fallback: StringValue,
): StringValue | number {
  const value = (raw ?? fallback).trim();
  if (/^\d+$/.test(value)) return Number(value);
  return value as StringValue;
}

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_NATS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [
              config.get<string>('NATS_URL') ?? 'nats://localhost:4222',
            ],
          },
        }),
      },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: parseExpiresIn(
            config.get<string>('JWT_ACCESS_TTL'),
            '15m',
          ),
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: AuthSession.name, schema: SessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, UserServiceClient],
})
export class AuthModule {}
