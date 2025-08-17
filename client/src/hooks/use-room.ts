import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Room } from "@shared/schema";

interface RoomWithStatus extends Room {
  hasPassword: boolean;
  timeRemaining: string;
  isExpired: boolean;
}

export function useRoom(roomId: string | undefined) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const { data: room, isLoading, error } = useQuery<RoomWithStatus>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Calculate time remaining
  useEffect(() => {
    if (!room?.expiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(room.expiresAt);
      const diffInMs = expiry.getTime() - now.getTime();

      if (diffInMs <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diffInMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [room?.expiresAt]);

  return {
    room: room ? { ...room, timeRemaining, isExpired: timeRemaining === "Expired" } : undefined,
    isLoading,
    error: error as Error | null,
  };
}
