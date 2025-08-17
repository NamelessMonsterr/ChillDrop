import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Home, Clock, FileText, Users, Link, QrCode, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoom } from "@/hooks/use-room";
import { useFiles } from "@/hooks/use-files";
import { useChat } from "@/hooks/use-chat";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import { Chat } from "@/components/chat";
import { QRModal } from "@/components/qr-modal";
import type { File } from "@shared/schema";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { toast } = useToast();

  const { room, isLoading: roomLoading } = useRoom(roomId);
  const { files, fileCount, totalSize } = useFiles(roomId);
  const { participantCount } = useChat(roomId);

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Room Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This room doesn't exist or has expired.
          </p>
          <Button onClick={() => setLocation("/")} className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (room.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Room Expired</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This room has expired and is no longer accessible.
          </p>
          <Button onClick={() => setLocation("/")} className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      const roomUrl = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Link Copied",
        description: "Room link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShareFile = (file: File) => {
    // File sharing is now handled directly in the Chat component
    toast({
      title: "File Shared",
      description: `${file.filename} shared in chat`,
    });
  };

  return (
    <div className="min-h-screen" data-testid="room-page">
      {/* Background Gradient */}
      <div className="fixed inset-0 gradient-mesh opacity-30 dark:opacity-20"></div>
      <div className="fixed inset-0 bg-white/30 dark:bg-black/30"></div>
      
      <div className="relative z-10">
        {/* Room Header */}
        <div className="container mx-auto px-6 py-6">
          <div className="glass rounded-2xl p-6 mb-6" data-testid="room-header">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  <Home className="inline mr-2 text-primary-500" />
                  <span data-testid="room-name">{room.name}</span>
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-300" data-testid="room-expiry">
                    <div className="glass rounded-lg p-3 flex items-center space-x-2 w-full">
                      <Clock className="text-secondary-500 h-4 w-4" />
                      <div>
                        <p className="font-medium">Expires in</p>
                        <p className="text-secondary-500 font-semibold">{room.timeRemaining}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300" data-testid="file-stats">
                    <div className="glass rounded-lg p-3 flex items-center space-x-2 w-full">
                      <FileText className="text-primary-500 h-4 w-4" />
                      <div>
                        <p className="font-medium">Storage Used</p>
                        <p className="text-primary-500 font-semibold">{fileCount} files ({totalSize})</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300" data-testid="participant-count">
                    <div className="glass rounded-lg p-3 flex items-center space-x-2 w-full">
                      <Users className="text-green-500 h-4 w-4" />
                      <div>
                        <p className="font-medium">Active Users</p>
                        <p className="text-green-500 font-semibold">{participantCount} online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCopyLink}
                  variant="ghost"
                  className="glass hover:bg-white/20 transition-all"
                  data-testid="button-copy-link"
                >
                  <Link className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  onClick={() => setQrModalOpen(true)}
                  variant="ghost"
                  className="glass hover:bg-white/20 transition-all"
                  data-testid="button-qr-code"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
                <Button
                  onClick={() => setLocation("/")}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 transition-all"
                  data-testid="button-leave-room"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave
                </Button>
              </div>
            </div>
          </div>
          
          {/* Room Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Files Section */}
            <div className="lg:col-span-2 space-y-6">
              <FileUpload roomId={roomId!} />
              <FileList roomId={roomId!} onShareFile={handleShareFile} />
            </div>
            
            {/* Chat Section */}
            <div>
              <Chat roomId={roomId!} />
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        roomId={roomId!}
      />
    </div>
  );
}
