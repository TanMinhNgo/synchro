"use client";

import { VoiceChat } from "@/components/ui/chat-bubble";

const mockUsers = [
  {
    id: "user-1",
    name: "Oguz",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=128&q=80",
    isSpeaking: true,
  },
  {
    id: "user-2",
    name: "Ashish",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "user-3",
    name: "Mariana",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "user-4",
    name: "MDS",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "user-5",
    name: "Ana",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "user-6",
    name: "Natko",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
    isSpeaking: true,
  },
  {
    id: "user-7",
    name: "Afshin",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80",
  },
  {
    id: "user-8",
    name: "Jane",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
  },
];

const VoiceChatDemo = () => {
  const handleJoinChat = () => {
    console.log("Attempting to join the voice chat...");
    alert("Joining voice chat!");
  };

  return (
    <div className="flex h-[200px] items-start justify-center rounded-lg bg-background p-8">
      <VoiceChat users={mockUsers} onJoin={handleJoinChat} />
    </div>
  );
};

export default VoiceChatDemo;
