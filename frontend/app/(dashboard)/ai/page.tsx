'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot } from 'lucide-react';

export default function AiAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Chat with Synchro AI to manage your tasks effectively.</p>
      </div>

      <Card className="mt-6 flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                Hello! I am your AI assistant. How can I help you with your projects today?
              </div>
            </div>
          </div>
          
          <div className="border-t p-4">
            <form className="flex items-center gap-2">
              <Input placeholder="Type your message..." className="flex-1" />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
