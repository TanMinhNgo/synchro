import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { USER_SERVICE_NATS_CLIENT, userServiceSubjects } from './user-service.nats';

export type RemoteUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  passwordHash?: string;
  providers?: {
    google?: { id: string };
  };
};

type FindByIdReq = { userId: string };
type FindByEmailReq = { email: string };
type FindByGoogleIdReq = { googleId: string };
type CreateLocalUserReq = { email: string; name: string; passwordHash: string };
type CreateGoogleUserReq = { email: string; name: string; googleId: string; avatarUrl?: string };

type FindUserRes = { user: RemoteUser | null };
type CreateUserRes = { user: RemoteUser };

@Injectable()
export class UserServiceClient {
  constructor(@Inject(USER_SERVICE_NATS_CLIENT) private readonly client: ClientProxy) {}

  private async send<Req, Res>(subject: string, payload: Req): Promise<Res> {
    try {
      return await firstValueFrom(this.client.send<Res, Req>(subject, payload).pipe(timeout(5000)));
    } catch (e: unknown) {
      throw new BadGatewayException('user-service (NATS) request failed');
    }
  }

  async findById(userId: string): Promise<RemoteUser | null> {
    const res = await this.send<FindByIdReq, FindUserRes>(userServiceSubjects.findById, { userId });
    return res.user;
  }

  async findByEmail(email: string): Promise<RemoteUser | null> {
    const res = await this.send<FindByEmailReq, FindUserRes>(userServiceSubjects.findByEmail, { email });
    return res.user;
  }

  async findByGoogleId(googleId: string): Promise<RemoteUser | null> {
    const res = await this.send<FindByGoogleIdReq, FindUserRes>(userServiceSubjects.findByGoogleId, { googleId });
    return res.user;
  }

  async createLocalUser(params: CreateLocalUserReq): Promise<RemoteUser> {
    const res = await this.send<CreateLocalUserReq, CreateUserRes>(userServiceSubjects.createLocalUser, params);
    return res.user;
  }

  async createGoogleUser(params: CreateGoogleUserReq): Promise<RemoteUser> {
    const res = await this.send<CreateGoogleUserReq, CreateUserRes>(userServiceSubjects.createGoogleUser, params);
    return res.user;
  }
}
