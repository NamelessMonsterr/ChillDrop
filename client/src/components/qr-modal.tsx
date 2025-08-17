import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function QRModal({ open, onOpenChange, roomId }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { toast } = useToast();
  
  const roomUrl = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    if (open && roomUrl) {
      QRCode.toDataURL(roomUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [open, roomUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Room link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-none shadow-2xl max-w-md animate-slide-up text-center" data-testid="modal-qr">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Share Room
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mb-6">
            Scan QR code or copy link to join this room
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-white p-6 rounded-2xl mb-6 mx-auto w-fit">
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt={`QR Code for room ${roomId}`}
                className="w-full h-full object-contain"
                data-testid="qr-code-image"
              />
            ) : (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Generating QR Code...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Room Link:</p>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all flex-1" data-testid="text-room-url">
              {roomUrl}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="glass hover:bg-white/20"
              data-testid="button-copy-link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
          data-testid="button-close-qr"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
