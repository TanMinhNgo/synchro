'use client';

import * as React from 'react';
import {
  StreamChat,
  type Channel as StreamChannel,
  type Event,
} from 'stream-chat';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentUser } from '@/features/auth';
import { useChatToken } from '@/features/chat';

function formatTime(value?: string | Date) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const tokenQuery = useChatToken(Boolean(me));

  const callId = 'general';

  const [client, setClient] = React.useState<StreamChat | null>(null);
  const [channel, setChannel] = React.useState<StreamChannel | null>(null);
  const [messagesVersion, setMessagesVersion] = React.useState(0);
  const [text, setText] = React.useState('');
  const lastMessageRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!tokenQuery.data) return;

    const { apiKey, token, user, defaultChannel } = tokenQuery.data;
    const chatClient = StreamChat.getInstance(apiKey);

    let cancelled = false;
    let cleanupChannel: (() => void) | null = null;

    (async () => {
      try {
        await chatClient.connectUser(
          {
            id: user.id,
            name: user.name,
            ...(user.image ? { image: user.image } : {}),
          },
          token,
        );

        const ch = chatClient.channel(defaultChannel.type, defaultChannel.id);
        await ch.watch({ presence: true });

        const onEvent = (_event: Event) => {
          setMessagesVersion((v) => v + 1);
        };
        ch.on(onEvent);
        cleanupChannel = () => ch.off(onEvent);

        if (!cancelled) {
          setClient(chatClient);
          setChannel(ch);
          setMessagesVersion((v) => v + 1);
        }
      } catch {
        if (!cancelled) {
          setClient(null);
          setChannel(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanupChannel?.();
      setChannel(null);
      setClient(null);
      chatClient.disconnectUser();
    };
  }, [tokenQuery.data]);

  React.useEffect(() => {
    // Auto-scroll on new messages.
    lastMessageRef.current?.scrollIntoView({ block: 'end' });
  }, [messagesVersion]);

  if (meLoading || tokenQuery.isLoading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading chat…</div>
      </Card>
    );
  }

  if (tokenQuery.isError) {
    return (
      <Card className="p-6 border-destructive/30">
        <div className="text-sm">Failed to load chat token.</div>
        <div className="text-xs text-muted-foreground mt-1">
          {(tokenQuery.error as Error | undefined)?.message ?? 'Unknown error'}
        </div>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">
          Chat is not connected.
        </div>
      </Card>
    );
  }

  const messages = channel?.state?.messages ?? [];

  return (
    <div className="h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
            <p className="text-muted-foreground">
              Message other members in real time.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              const url = `/chat/call?callId=${encodeURIComponent(callId)}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            Video call
          </Button>
        </div>
      </div>

      <Card className="h-[calc(100vh-220px)] overflow-hidden flex flex-col">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-semibold">General</div>
          <div className="text-xs text-muted-foreground">
            Everyone who opens Chat joins this room.
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No messages yet.
              </div>
            ) : (
              messages.map((m, idx) => {
                const mine =
                  m.user?.id &&
                  tokenQuery.data?.user.id &&
                  m.user.id === tokenQuery.data.user.id;
                return (
                  <div
                    key={m.id}
                    ref={
                      idx === messages.length - 1 ? lastMessageRef : undefined
                    }
                    className={mine ? 'flex justify-end' : 'flex justify-start'}
                  >
                    <div
                      className={
                        mine
                          ? 'max-w-[70%] rounded-xl bg-secondary px-3 py-2'
                          : 'max-w-[70%] rounded-xl border px-3 py-2'
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-muted-foreground truncate">
                          {mine
                            ? 'You'
                            : (m.user?.name ?? m.user?.id ?? 'Unknown')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                      <div className="text-sm whitespace-pre-wrap wrap-break-word">
                        {m.text ?? ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <form
          className="border-t p-3 flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const value = text.trim();
            if (!value) return;
            if (!channel) return;
            setText('');
            await channel.sendMessage({ text: value });
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
          />
          <Button type="submit" disabled={!channel || !text.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
