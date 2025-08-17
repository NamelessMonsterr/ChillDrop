import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Message } from "@shared/schema";

export function useChat(roomId: string | undefined) {
  const [participantCount] = useState(4); // This would come from realtime presence

  const { data: messages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Get recent message count for notifications
  const recentMessageCount = messages.filter(msg => {
    const msgTime = new Date(msg.createdAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return msgTime > fiveMinutesAgo;
  }).length;

  return {
    messages,
    participantCount,
    recentMessageCount,
    isLoading,
    error: error as Error | null,
  };
}
