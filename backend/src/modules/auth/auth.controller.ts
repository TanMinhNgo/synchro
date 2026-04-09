import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UserServiceClient } from './user-service.client';
import { UpdateProfileDto } from './dto/update-profile.dto';

function isProd(env?: string) {
  return env === 'production';
}

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly cookieName: string;
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserServiceClient,
    private readonly config: ConfigService,
  ) {
    this.cookieName =
      this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refresh_token';
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
  @ApiOperation({ summary: 'Register with email/password' })
  @ApiOkResponse({
    description: 'JWT tokens (refresh token also stored in httpOnly cookie)',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token.example',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example',
      },
    },
  })
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
    this.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiOkResponse({
    description: 'JWT tokens (refresh token also stored in httpOnly cookie)',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token.example',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
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
    this.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    description: 'New JWT tokens (refresh token rotated)',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token.example',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing/invalid/expired refresh token',
  })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req as any).cookies?.[this.cookieName] as
      | string
      | undefined;
    const refreshToken = dto.refreshToken ?? cookieToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const result = await this.auth.refresh(refreshToken);
    this.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiOkResponse({
    schema: {
      example: { ok: true },
    },
  })
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
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: '65f0c0d2e2d3d4f5a6b7c8d9',
          email: 'user@example.com',
          name: 'Minh Ngo',
          avatarUrl: 'https://example.com/avatar.png',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized (missing/invalid access token) or user not found',
  })
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

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (name/avatar)' })
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: '65f0c0d2e2d3d4f5a6b7c8d9',
          email: 'user@example.com',
          name: 'Minh Ngo',
          avatarUrl: 'https://example.com/avatar.png',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized (missing/invalid access token) or user not found',
  })
  async updateMe(
    @CurrentUser() user: { sub: string; email: string },
    @Body() dto: UpdateProfileDto,
  ) {
    if (!user?.sub) {
      throw new UnauthorizedException('Unauthorized');
    }

    const updated = await this.users.updateProfile(user.sub, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
      },
    };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth login' })
  async googleLogin() {
    return;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiOkResponse({
    description: 'JWT tokens (refresh token also stored in httpOnly cookie)',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token.example',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example',
      },
    },
  })
  async googleCallback(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = req.user as {
      email: string;
      name: string;
      googleId: string;
      avatarUrl?: string;
    };
    const result = await this.auth.loginWithGoogle(profile);
    this.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
