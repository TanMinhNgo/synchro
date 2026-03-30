import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UsersService } from '../users/users.service';

function isProd(env?: string) {
  return env === 'production';
}

@Controller('auth')
export class AuthController {
  private readonly cookieName: string;
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {
    this.cookieName = this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refresh_token';
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    res.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: isProd(this.config.get<string>('NODE_ENV')),
      sameSite: 'lax',
      expires: expiresAt,
      path: '/auth',
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(this.cookieName, { path: '/auth' });
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login({
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req as any).cookies?.[this.cookieName] as string | undefined;
    const refreshToken = dto.refreshToken ?? cookieToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const result = await this.auth.refresh(refreshToken);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req as any).cookies?.[this.cookieName] as string | undefined;
    if (token) {
      await this.auth.logout(token);
    }
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user?: { sub: string; email: string }) {
    if (!user?.sub) {
      throw new UnauthorizedException('Unauthorized');
    }
    const dbUser = await this.users.findById(user.sub);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
      },
    };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleLogin() {
    return;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const profile = req.user as { email: string; name: string; googleId: string; avatarUrl?: string };
    const result = await this.auth.loginWithGoogle(profile);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }
}
