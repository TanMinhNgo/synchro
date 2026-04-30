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
    <div className="flex h-156 flex-col rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-2">
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
                    ? 'rounded-br-md bg-amber-300 text-zinc-900'
                    : 'rounded-bl-md bg-slate-700 text-slate-100'
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
          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
        />
        <Button
          size="icon"
          className="shrink-0 bg-orange-500 text-zinc-950 hover:bg-orange-400"
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
