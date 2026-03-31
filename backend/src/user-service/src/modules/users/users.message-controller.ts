import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { userServiceSubjects } from './users.messages';
import type {
  CreateGoogleUserReq,
  CreateLocalUserReq,
  CreateUserRes,
  FindByEmailReq,
  FindByGoogleIdReq,
  FindByIdReq,
  FindUserRes,
  RemoteUser,
} from './users.messages';

function toRemoteUser(doc: any): RemoteUser {
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    passwordHash: doc.passwordHash,
    providers: doc.providers,
  };
}

@Controller()
export class UsersMessageController {
  constructor(private readonly users: UsersService) {}

  @MessagePattern(userServiceSubjects.findById)
  async findById(@Payload() payload: FindByIdReq): Promise<FindUserRes> {
    const user = await this.users.findById(payload.userId);
    return { user: user ? toRemoteUser(user) : null };
  }

  @MessagePattern(userServiceSubjects.findByEmail)
  async findByEmail(@Payload() payload: FindByEmailReq): Promise<FindUserRes> {
    const user = await this.users.findByEmail(payload.email);
    return { user: user ? toRemoteUser(user) : null };
  }

  @MessagePattern(userServiceSubjects.findByGoogleId)
  async findByGoogleId(@Payload() payload: FindByGoogleIdReq): Promise<FindUserRes> {
    const user = await this.users.findByGoogleId(payload.googleId);
    return { user: user ? toRemoteUser(user) : null };
  }

  @MessagePattern(userServiceSubjects.createLocalUser)
  async createLocalUser(@Payload() payload: CreateLocalUserReq): Promise<CreateUserRes> {
    const user = await this.users.createLocalUser(payload);
    return { user: toRemoteUser(user) };
  }

  @MessagePattern(userServiceSubjects.createGoogleUser)
  async createGoogleUser(@Payload() payload: CreateGoogleUserReq): Promise<CreateUserRes> {
    const user = await this.users.createGoogleUser(payload);
    return { user: toRemoteUser(user) };
  }
}
