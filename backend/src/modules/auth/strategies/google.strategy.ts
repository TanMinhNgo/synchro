import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

export type GoogleProfile = {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? 'disabled',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'disabled',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:8080/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile): Promise<GoogleProfile> {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    if (!email) {
      return {
        email: '',
        name,
        googleId: profile.id,
        avatarUrl: profile.photos?.[0]?.value,
      };
    }
    return {
      email,
      name,
      googleId: profile.id,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
