import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, File, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/supabase";
import { EmojiPicker } from "@/components/emoji-picker";
import { FilePicker } from "@/components/file-picker";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Message, File as FileType } from "@shared/schema";

interface ChatProps {
  roomId: string;
}

interface MessageWithFile extends Message {
  file?: FileType;
}

export function Chat({ roomId }: ChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get or set sender name
  useEffect(() => {
    const stored = localStorage.getItem(`chillDrop_userName_${roomId}`);
    if (!stored) {
      const name = prompt("Enter your name for the chat:") || "Anonymous";
      setSenderName(name);
      localStorage.setItem(`chillDrop_userName_${roomId}`, name);
    } else {
      setSenderName(stored);
    }
  }, [roomId]);

  // WebSocket hook for real-time features
  const { isConnected, participantCount, typingUsers, handleTyping, sendTypingStop } = useWebSocket(
    roomId, 
    userId, 
    senderName
  );

  const { data: messages = [], isLoading } = useQuery<MessageWithFile[]>({
    queryKey: ["/api/rooms", roomId, "messages"],
    // Real-time updates via WebSocket, reduce polling frequency
    refetchInterval: isConnected ? 10000 : 2000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; fileId?: string }) => {
      const response = await apiRequest("POST", "/api/messages", {
        roomId,
        senderName,
        content: messageData.content,
        fileId: messageData.fileId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !senderName) return;
    
    sendMessageMutation.mutate({
      content: newMessage.trim(),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping(); // Use WebSocket typing handler
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      sendTypingStop(); // Stop typing indicator
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (message: MessageWithFile) => {
    return message.senderName === senderName;
  };

  const shareFileInChat = (file: FileType) => {
    sendMessageMutation.mutate({
      content: `Shared: ${file.filename}`,
      fileId: file.id,
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileSelect = async (files: File[]) => {
    setUploadingFiles(files);
    
    for (const file of files) {
      try {
        // Upload file
        const fileName = `${Date.now()}-${file.name}`;
        const storagePath = `${roomId}/${fileName}`;
        
        await uploadFile(file, storagePath);
        
        // Save file metadata to database
        const fileData = {
          roomId,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storagePath,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const response = await apiRequest("POST", "/api/files", fileData);
        const savedFile = await response.json();
        
        // Send message with file attachment
        sendMessageMutation.mutate({
          content: `📎 ${file.name}`,
          fileId: savedFile.id,
        });
        
        // Refresh file list
        queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "files"] });
        
        toast({
          title: "File Uploaded",
          description: `${file.name} has been shared in chat`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setUploadingFiles([]);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 h-96">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 h-fit lg:sticky lg:top-6" data-testid="chat-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          <MessageCircle className="inline mr-2 text-primary-500" />
          Chat
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {isConnected ? `Online${participantCount > 0 ? ` (${participantCount})` : ''}` : 'Connecting...'}
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto mb-4 space-y-3 pr-2" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-bubble ${isMyMessage(message) ? "ml-auto" : ""}`}
              data-testid={`message-${message.id}`}
            >
              <div className="file-preview rounded-xl p-3 max-w-xs">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <span className="font-medium">
                    {isMyMessage(message) ? "You" : message.senderName}
                  </span>
                  <span className="ml-auto">{formatTime(message.createdAt.toString())}</span>
                </div>
                
                {message.fileId && message.file && (
                  <div className="file-preview rounded-lg p-2 mb-2 bg-primary-500/10 border border-primary-500/20">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-primary-500" />
                      <span className="text-sm font-medium">{message.file.filename}</span>
                      <span className="text-xs text-gray-500">
                        {Math.round(message.file.fileSize / 1024)}KB
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-gray-900 dark:text-white">{message.content}</p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="glass rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <Upload className="h-4 w-4 animate-pulse" />
            <span>Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...</span>
          </div>
        </div>
      )}
      
      {/* Chat Input */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 glass rounded-xl p-3 flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white p-0"
              data-testid="input-chat-message"
            />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <FilePicker onFileSelect={handleFileSelect} />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
