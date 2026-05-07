'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bot, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssistantChat } from '@/features/ai-agent';
import { AiAgentChatPanel } from './ai-agent-panel/AiAgentChatPanel';
import type { AiAgentChatMessage } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentPanel() {
  const [isOpen, setIsOpen] = React.useState(true);
  const [chatInput, setChatInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<AiAgentChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I am Synchro AI. Ask me anything about your projects or tasks.',
    },
  ]);

  const assistantChatMutation = useAssistantChat();

  const appendChatMessage = React.useCallback(
    (role: 'assistant' | 'user', text: string) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role,
          text,
        },
      ]);
    },
    [],
  );

  const chatViewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    chatViewportRef.current?.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages]);

  const handleSendChat = React.useCallback(() => {
    const message = chatInput.trim();
    if (!message || assistantChatMutation.isPending) return;

    const nextMessages = [
      ...chatMessages,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: 'user' as const,
        text: message,
      },
    ];

    setChatMessages(nextMessages);
    setChatInput('');

    assistantChatMutation.mutate(
      {
        messages: nextMessages.map((item) => ({
          role: item.role,
          content: item.text,
        })),
      },
      {
        onSuccess: (res) => {
          appendChatMessage('assistant', res.reply);
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to reach AI assistant');
          appendChatMessage(
            'assistant',
            'Sorry, I could not respond right now. Please try again.',
          );
        },
      },
    );
  }, [appendChatMessage, assistantChatMutation, chatInput, chatMessages]);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="h-160 w-[min(96vw,28rem)] overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-foreground shadow-[0_28px_70px_-40px_rgba(22,24,32,0.45)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/70 bg-background/80 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Synchro AI Agent
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Chat with AI assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/tasks/ai-agent">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full border-border/70 bg-background/80 text-foreground hover:bg-accent/60"
                  >
                    Auto tools
                    <ExternalLink className="ml-2 size-3" />
                  </Button>
                </Link>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close AI agent panel"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-2">
              <AiAgentChatPanel
                chatMessages={chatMessages}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSend={handleSendChat}
                sendDisabled={assistantChatMutation.isPending}
                chatViewportRef={chatViewportRef}
              />
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-12 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Bot className="mr-2 size-5" />
          {isOpen ? 'Hide AI Agent' : 'Open AI Agent'}
        </Button>
      </div>
    </div>
  );
}
