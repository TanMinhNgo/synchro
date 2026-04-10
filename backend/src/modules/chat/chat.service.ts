import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { UserServiceClient } from '@/modules/auth/user-service.client';

const GENERAL_CHANNEL_TYPE = 'messaging';
const GENERAL_CHANNEL_ID = 'general';

const DEFAULT_CALL_TYPE = 'default';
const DEFAULT_CALL_ID = 'general';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UserServiceClient,
  ) {}

  private getServerClient() {
    const apiKey = this.config.getOrThrow<string>('STREAM_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('STREAM_API_SECRET');
    return { apiKey, client: StreamChat.getInstance(apiKey, apiSecret) };
  }

  private async ensureGeneralChannelMembership(
    client: StreamChat,
    userId: string,
  ) {
    const channel = client.channel(GENERAL_CHANNEL_TYPE, GENERAL_CHANNEL_ID, {
      created_by_id: userId,
    });

    try {
      await channel.create();
    } catch {
      console.warn(
        `General channel already exists, skipping creation (userId: ${userId})`,
      );
    }

    try {
      await channel.addMembers([userId]);
    } catch {
      console.warn(`Failed to add user to general channel (userId: ${userId})`);
    }
  }

  private normalizeCallId(value?: string) {
    const v = value?.trim();
    if (!v) return DEFAULT_CALL_ID;
    if (v.length > 64) return DEFAULT_CALL_ID;
    if (!/^[a-zA-Z0-9_-]+$/.test(v)) return DEFAULT_CALL_ID;
    return v;
  }

  async getTokenForUser(userId: string, fallbackEmail: string) {
    const { apiKey, client } = this.getServerClient();

    const profile = await this.users.findById(userId);
    const name = profile?.name?.trim() || fallbackEmail;
    const image = profile?.avatarUrl;

    // Make sure the user exists in Stream.
    await client.upsertUser({
      id: userId,
      name,
      ...(image ? { image } : {}),
    });

    await this.ensureGeneralChannelMembership(client, userId);

    const token = client.createToken(userId);

    return {
      apiKey,
      appId: this.config.get<string>('STREAM_APP_ID') ?? null,
      token,
      user: {
        id: userId,
        name,
        ...(image ? { image } : {}),
      },
      defaultChannel: {
        type: GENERAL_CHANNEL_TYPE,
        id: GENERAL_CHANNEL_ID,
      },
    };
  }

  async getVideoTokenForUser(
    userId: string,
    fallbackEmail: string,
    callId?: string,
  ) {
    const { apiKey, client } = this.getServerClient();

    const profile = await this.users.findById(userId);
    const name = profile?.name?.trim() || fallbackEmail;
    const image = profile?.avatarUrl;

    await client.upsertUser({
      id: userId,
      name,
      ...(image ? { image } : {}),
    });

    // Stream Video uses the same server-signed user token format.
    const token = client.createToken(userId);

    return {
      apiKey,
      appId: this.config.get<string>('STREAM_APP_ID') ?? null,
      token,
      user: {
        id: userId,
        name,
        ...(image ? { image } : {}),
      },
      call: {
        type: DEFAULT_CALL_TYPE,
        id: this.normalizeCallId(callId),
      },
    };
  }
}
