'use client';

import * as React from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AiAgentChatPanelProps } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentChatPanel({
  chatMessages,
  chatInput,
  onChatInputChange,
  onSend,
  sendDisabled,
  chatViewportRef,
}: AiAgentChatPanelProps) {
  return (
    <div className="flex h-140 flex-col rounded-3xl border border-border/70 bg-background/80 p-3">
      <ScrollArea className="min-h-0 flex-1">
        <div ref={chatViewportRef} className="space-y-2 pr-2">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`w-[70%] whitespace-pre-wrap wrap-break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-foreground shadow-sm'
                    : 'rounded-bl-md bg-muted/60 text-foreground'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-3 flex gap-2">
        <Input
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sendDisabled}
          placeholder="Ask Synchro AI about your project, report, or assignees"
          className="border-border/70 bg-background/80 text-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="icon"
          className="shrink-0 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          onClick={onSend}
          disabled={sendDisabled}
          aria-label="Send message"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
