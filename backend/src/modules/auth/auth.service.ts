import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { AuthSession, SessionDocument } from './schemas/session.schema';
import { UserServiceClient } from './user-service.client';
import type { StringValue } from 'ms';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly accessTtl: StringValue | number;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly users: UserServiceClient,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {
    const accessTtlRaw = (
      this.config.get<string>('JWT_ACCESS_TTL') ?? '15m'
    ).trim();
    this.accessTtl = /^\d+$/.test(accessTtlRaw)
      ? Number(accessTtlRaw)
      : (accessTtlRaw as StringValue);
    this.refreshTtlDays = Number(
      this.config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30',
    );
  }

  private async signAccessToken(user: { id: string; email: string }) {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        expiresIn: this.accessTtl,
      },
    );
  }

  private async createSession(params: {
    userId: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ refreshToken: string; expiresAt: Date }> {
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await this.sessionModel.create({
      userId: new Types.ObjectId(params.userId),
      refreshTokenHash: sha256(refreshToken),
      expiresAt,
      userAgent: params.userAgent,
      ip: params.ip,
    });

    return { refreshToken, expiresAt };
  }

  private async rotateSession(
    refreshToken: string,
  ): Promise<{ userId: string; newRefreshToken: string; expiresAt: Date }> {
    const tokenHash = sha256(refreshToken);
    const session = await this.sessionModel
      .findOne({ refreshTokenHash: tokenHash })
      .exec();

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const newRefreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    session.refreshTokenHash = sha256(newRefreshToken);
    session.expiresAt = expiresAt;
    await session.save();

    return { userId: session.userId.toString(), newRefreshToken, expiresAt };
  }

  async register(params: {
    email: string;
    name: string;
    password: string;
    userAgent?: string;
    ip?: string;
  }) {
    const email = params.email.toLowerCase().trim();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(params.password);
    const user = await this.users.createLocalUser({
      email,
      name: params.name,
      passwordHash,
    });

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    const session = await this.createSession({
      userId: user.id,
      userAgent: params.userAgent,
      ip: params.ip,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async login(params: {
    email: string;
    password: string;
    userAgent?: string;
    ip?: string;
  }) {
    const email = params.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, params.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    const session = await this.createSession({
      userId: user.id,
      userAgent: params.userAgent,
      ip: params.ip,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async loginWithGoogle(profile: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }) {
    const googleId = profile.googleId;
    const email = profile.email?.toLowerCase().trim();

    let user = await this.users.findByGoogleId(googleId);
    if (!user && email) {
      user = await this.users.findByEmail(email);
    }

    if (!user) {
      if (!email) {
        throw new UnauthorizedException('Google account has no email');
      }
      user = await this.users.createGoogleUser({
        email,
        name: profile.name || email,
        googleId,
        avatarUrl: profile.avatarUrl,
      });
    }

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    const session = await this.createSession({ userId: user.id });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async refresh(refreshToken: string) {
    const rotated = await this.rotateSession(refreshToken);
    const user = await this.users.findById(rotated.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: rotated.newRefreshToken,
      refreshTokenExpiresAt: rotated.expiresAt,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    await this.sessionModel.updateOne(
      { refreshTokenHash: tokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }
}
