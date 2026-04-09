'use client';

import * as React from 'react';
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth';
import { useVideoToken } from '@/features/chat';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function normalizeCallId(value: string | null | undefined) {
  const v = value?.trim();
  if (!v) return 'general';
  if (v.length > 64) return 'general';
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'general';
  return v;
}

export default function ChatCallPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const callId = React.useMemo(() => normalizeCallId(searchParams.get('callId')), [searchParams]);
  const videoTokenQuery = useVideoToken(Boolean(me), callId);

  const [videoClient, setVideoClient] = React.useState<StreamVideoClient | null>(null);
  const [videoCall, setVideoCall] = React.useState<ReturnType<StreamVideoClient['call']> | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(true);

  React.useEffect(() => {
    if (!videoTokenQuery.data) return;

    const { apiKey, token, user, call } = videoTokenQuery.data;
    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      token,
    });

    const c = client.call(call.type, call.id);
    let cancelled = false;
    setIsConnecting(true);

    (async () => {
      try {
        await c.join({ create: true });
        if (!cancelled) {
          setVideoClient(client);
          setVideoCall(c);
        }
      } catch {
        if (!cancelled) {
          setVideoClient(null);
          setVideoCall(null);
          toast.error('Cannot connect to the call.');
        }
      }
      finally {
        if (!cancelled) setIsConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsConnecting(false);
      setVideoCall(null);
      setVideoClient(null);
      c.leave().catch(() => undefined);
      client.disconnectUser().catch(() => undefined);
    };
  }, [videoTokenQuery.data]);

  if (meLoading || videoTokenQuery.isLoading || isConnecting) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-sm text-muted-foreground">Connecting to call…</div>
      </div>
    );
  }

  if (videoTokenQuery.isError) {
    return (
      <Card className="p-6 border-destructive/30">
        <div className="text-sm">Failed to load video token.</div>
        <div className="text-xs text-muted-foreground mt-1">
          {(videoTokenQuery.error as Error | undefined)?.message ?? 'Unknown error'}
        </div>
      </Card>
    );
  }

  if (!videoClient || !videoCall) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-sm text-muted-foreground">
          Could not initialize call. Please refresh or try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-top bg-muted/40">
      <div className="relative w-full max-w-6xl mx-auto px-4">
        <StreamVideo client={videoClient}>
          <StreamCall call={videoCall}>
            <Card className="overflow-hidden">
              <div className="border-b px-4 py-3">
                <div className="text-sm font-semibold">Video call</div>
                <div className="text-xs text-muted-foreground">Room: {callId}</div>
              </div>
              <div className="h-[70vh]">
                <CallContent
                  onLeft={() => {
                    try {
                      window.close();
                    } catch {
                      console.warn('Failed to close window after leaving call.');
                    }
                    router.push('/chat');
                  }}
                />
              </div>
            </Card>
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

function CallContent({ onLeft }: { onLeft: () => void }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  React.useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeft();
    }
  }, [callingState, onLeft]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <SpeakerLayout />
        </div>
        <div className="border-t">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
}
