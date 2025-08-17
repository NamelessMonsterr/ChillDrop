import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface RoomConnection {
  roomId: string;
  userId: string;
  userName: string;
  ws: WebSocket;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, RoomConnection>();
  private roomParticipants = new Map<string, Set<string>>();
  private typingUsers = new Map<string, Map<string, NodeJS.Timeout>>();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws' // Use specific path to avoid conflicts with Vite
    });
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'join_room':
        this.handleJoinRoom(ws, data);
        break;
      case 'leave_room':
        this.handleLeaveRoom(ws, data);
        break;
      case 'typing_start':
        this.handleTypingStart(ws, data);
        break;
      case 'typing_stop':
        this.handleTypingStop(ws, data);
        break;
      case 'new_message':
        this.broadcastToRoom(data.roomId, data, ws);
        break;
      case 'file_uploaded':
        this.broadcastToRoom(data.roomId, data, ws);
        break;
    }
  }

  private handleJoinRoom(ws: WebSocket, data: any) {
    const { roomId, userId, userName } = data;
    const connectionId = `${roomId}_${userId}`;
    
    // Remove existing connection for this user in this room
    this.removeUserFromRoom(roomId, userId);
    
    // Add new connection
    this.connections.set(connectionId, {
      roomId,
      userId,
      userName,
      ws
    });
    
    // Update room participants
    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }
    this.roomParticipants.get(roomId)!.add(userId);
    
    // Broadcast participant count update
    this.broadcastParticipantCount(roomId);
    
    console.log(`User ${userName} joined room ${roomId}`);
  }

  private handleLeaveRoom(ws: WebSocket, data: any) {
    const { roomId, userId } = data;
    this.removeUserFromRoom(roomId, userId);
    this.broadcastParticipantCount(roomId);
  }

  private handleTypingStart(ws: WebSocket, data: any) {
    const { roomId, userId, userName } = data;
    
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }
    
    const roomTyping = this.typingUsers.get(roomId)!;
    
    // Clear existing timeout
    if (roomTyping.has(userId)) {
      clearTimeout(roomTyping.get(userId)!);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      roomTyping.delete(userId);
      this.broadcastTypingUsers(roomId);
    }, 3000);
    
    roomTyping.set(userId, timeout);
    this.broadcastTypingUsers(roomId);
  }

  private handleTypingStop(ws: WebSocket, data: any) {
    const { roomId, userId } = data;
    
    if (this.typingUsers.has(roomId)) {
      const roomTyping = this.typingUsers.get(roomId)!;
      if (roomTyping.has(userId)) {
        clearTimeout(roomTyping.get(userId)!);
        roomTyping.delete(userId);
        this.broadcastTypingUsers(roomId);
      }
    }
  }

  private handleDisconnection(ws: WebSocket) {
    // Find and remove the connection
    for (const [connectionId, connection] of Array.from(this.connections.entries())) {
      if (connection.ws === ws) {
        this.removeUserFromRoom(connection.roomId, connection.userId);
        this.broadcastParticipantCount(connection.roomId);
        this.connections.delete(connectionId);
        console.log(`User ${connection.userName} disconnected from room ${connection.roomId}`);
        break;
      }
    }
  }

  private removeUserFromRoom(roomId: string, userId: string) {
    const connectionId = `${roomId}_${userId}`;
    this.connections.delete(connectionId);
    
    if (this.roomParticipants.has(roomId)) {
      this.roomParticipants.get(roomId)!.delete(userId);
      
      // Clean up empty room
      if (this.roomParticipants.get(roomId)!.size === 0) {
        this.roomParticipants.delete(roomId);
        this.typingUsers.delete(roomId);
      }
    }
    
    // Clear typing indicator
    if (this.typingUsers.has(roomId)) {
      const roomTyping = this.typingUsers.get(roomId)!;
      if (roomTyping.has(userId)) {
        clearTimeout(roomTyping.get(userId)!);
        roomTyping.delete(userId);
        this.broadcastTypingUsers(roomId);
      }
    }
  }

  private broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    if (!this.roomParticipants.has(roomId)) return;
    
    for (const [connectionId, connection] of Array.from(this.connections.entries())) {
      if (connection.roomId === roomId && connection.ws !== excludeWs) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify(message));
        }
      }
    }
  }

  private broadcastParticipantCount(roomId: string) {
    const count = this.roomParticipants.get(roomId)?.size || 0;
    this.broadcastToRoom(roomId, {
      type: 'participant_count',
      roomId,
      count
    });
  }

  private broadcastTypingUsers(roomId: string) {
    const typingUserNames: string[] = [];
    
    if (this.typingUsers.has(roomId)) {
      const roomTyping = this.typingUsers.get(roomId)!;
      for (const userId of Array.from(roomTyping.keys())) {
        const connection = this.connections.get(`${roomId}_${userId}`);
        if (connection) {
          typingUserNames.push(connection.userName);
        }
      }
    }
    
    this.broadcastToRoom(roomId, {
      type: 'typing_users',
      roomId,
      users: typingUserNames
    });
  }

  broadcastNewMessage(roomId: string, message: any) {
    this.broadcastToRoom(roomId, {
      type: 'new_message',
      roomId,
      message
    });
  }

  broadcastFileUploaded(roomId: string, file: any) {
    this.broadcastToRoom(roomId, {
      type: 'file_uploaded',
      roomId,
      file
    });
  }
}

export const wsManager = new WebSocketManager();