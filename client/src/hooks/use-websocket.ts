import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  roomId: string;
  [key: string]: any;
}

export function useWebSocket(roomId: string | undefined, userId: string | undefined, userName: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId || !userId || !userName) return;

    // Connect to WebSocket on a different path to avoid Vite conflicts
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Join room
      ws.current?.send(JSON.stringify({
        type: 'join_room',
        roomId,
        userId,
        userName
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.send(JSON.stringify({
          type: 'leave_room',
          roomId,
          userId
        }));
        ws.current.close();
      }
    };
  }, [roomId, userId, userName]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'participant_count':
        setParticipantCount(message.count);
        break;
      case 'typing_users':
        setTypingUsers(message.users.filter((user: string) => user !== userName));
        break;
      case 'new_message':
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ 
          queryKey: ["/api/rooms", roomId, "messages"] 
        });
        break;
      case 'file_uploaded':
        // Invalidate files query to refetch
        queryClient.invalidateQueries({ 
          queryKey: ["/api/rooms", roomId, "files"] 
        });
        break;
    }
  };

  const sendTypingStart = () => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({
        type: 'typing_start',
        roomId,
        userId,
        userName
      }));
    }
  };

  const sendTypingStop = () => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({
        type: 'typing_stop',
        roomId,
        userId,
        userName
      }));
    }
  };

  const handleTyping = () => {
    sendTypingStart();
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set timeout to stop typing after 3 seconds
    typingTimeout.current = setTimeout(() => {
      sendTypingStop();
    }, 3000);
  };

  return {
    isConnected,
    participantCount,
    typingUsers,
    handleTyping,
    sendTypingStop
  };
}