import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findById(userId: string) {
    return this.userModel.findById(userId).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findByGoogleId(googleId: string) {
    return this.userModel.findOne({ 'providers.google.id': googleId }).exec();
  }

  async createLocalUser(params: {
    email: string;
    name: string;
    passwordHash: string;
  }) {
    const doc = await this.userModel.create({
      email: params.email.toLowerCase().trim(),
      name: params.name.trim(),
      passwordHash: params.passwordHash,
    });
    return doc;
  }

  async createGoogleUser(params: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }) {
    const doc = await this.userModel.create({
      email: params.email.toLowerCase().trim(),
      name: params.name.trim(),
      avatarUrl: params.avatarUrl,
      providers: {
        google: { id: params.googleId },
      },
    });
    return doc;
  }

  async updateProfile(
    userId: string,
    params: { name?: string; avatarUrl?: string },
  ) {
    const update: Record<string, unknown> = {};
    if (typeof params.name === 'string') {
      update.name = params.name.trim();
    }
    if (typeof params.avatarUrl === 'string') {
      update.avatarUrl = params.avatarUrl.trim();
    }

    if (Object.keys(update).length === 0) {
      return this.findById(userId);
    }

    return this.userModel
      .findByIdAndUpdate(userId, update, { new: true })
      .exec();
  }
}
