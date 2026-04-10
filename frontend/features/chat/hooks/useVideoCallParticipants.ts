'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { useVideoToken } from './useChatToken';
import { videoLoggerSystem } from '@stream-io/video-client';

let didConfigureStreamVideoLogger = false;

function configureStreamVideoLoggerOnce() {
  if (didConfigureStreamVideoLogger) return;
  didConfigureStreamVideoLogger = true;

  try {
    videoLoggerSystem.configureLoggers({
      coordinator: { level: 'error', sink: () => undefined },
      // Some builds may use the default scope; keep it quiet too.
      default: { level: 'warn' },
    });
  } catch {
    console.warn('Failed to configure Stream Video logger.');
  }
}

configureStreamVideoLoggerOnce();

export type VoiceChatParticipant = {
  id: string;
  name: string;
  avatarUrl: string;
  isSpeaking?: boolean;
};

function uniqById(items: VoiceChatParticipant[]) {
  const seen = new Set<string>();
  const out: VoiceChatParticipant[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function useVideoCallParticipants(enabled: boolean, callId: string) {
  const tokenQuery = useVideoToken(enabled, callId);

  const videoClient = React.useMemo(() => {
    if (!tokenQuery.data) return null;

    const { apiKey, token, user } = tokenQuery.data;
    return new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      token,
    });
  }, [tokenQuery.data]);

  React.useEffect(() => {
    if (!videoClient) return;
    return () => {
      videoClient.disconnectUser().catch(() => undefined);
    };
  }, [videoClient]);

  const participantsQuery = useQuery({
    queryKey: ['chat', 'video-participants', callId, tokenQuery.data?.token],
    enabled:
      enabled &&
      Boolean(videoClient) &&
      Boolean(tokenQuery.data) &&
      tokenQuery.isSuccess,
    refetchInterval: 3_000,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      try {
        if (!videoClient) return [] as VoiceChatParticipant[];
        if (!tokenQuery.data) return [] as VoiceChatParticipant[];

        const call = videoClient.call(
          tokenQuery.data.call.type,
          tokenQuery.data.call.id,
        );
        const res = await call.queryParticipants({}, { limit: 12 });

        const rows = Array.isArray((res as any)?.participants)
          ? (res as any).participants
          : [];

        const mapped = rows
          .map((p: any) => {
            const u = p?.user ?? null;
            const id: string | undefined =
              u?.id ?? p?.user_id ?? p?.userId ?? p?.id ?? undefined;
            if (!id) return null;

            const name: string = (u?.name ?? u?.id ?? id) as string;
            const image: string | undefined =
              u?.image ?? u?.image_url ?? u?.avatar ?? undefined;

            return {
              id,
              name,
              avatarUrl:
                image ||
                `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`,
            } satisfies VoiceChatParticipant;
          })
          .filter(Boolean) as VoiceChatParticipant[];

        return uniqById(mapped);
      } catch {
        return [] as VoiceChatParticipant[];
      }
    },
  });

  return {
    tokenQuery,
    participantsQuery,
  };
}
