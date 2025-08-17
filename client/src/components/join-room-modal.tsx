import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const joinRoomSchema = z.object({
  roomId: z.string().min(1, "Room ID or link is required"),
});

type JoinRoomData = z.infer<typeof joinRoomSchema>;

interface JoinRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinRoom: (roomId: string) => void;
}

export function JoinRoomModal({ open, onOpenChange, onJoinRoom }: JoinRoomModalProps) {
  const { toast } = useToast();
  
  const form = useForm<JoinRoomData>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      roomId: "",
    },
  });

  const extractRoomId = (input: string): string => {
    // Extract room ID from URL if provided
    const urlMatch = input.match(/\/room\/([a-zA-Z0-9-]+)/);
    return urlMatch ? urlMatch[1] : input.trim();
  };

  const onSubmit = async (data: JoinRoomData) => {
    try {
      const roomId = extractRoomId(data.roomId);
      
      // Check if room exists
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error("Room not found");
      }
      
      const room = await response.json();
      
      if (room.hasPassword) {
        // Room requires password - parent component will handle password modal
        onJoinRoom(roomId);
      } else {
        // Join room directly
        onJoinRoom(roomId);
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Room not found or invalid room ID",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-none shadow-2xl max-w-md animate-slide-up" data-testid="modal-join-room">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Join Room
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Enter room ID or paste the share link
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room ID or Link
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="abc123 or https://chilldrop.com/room/abc123"
                      className="glass border-none text-gray-900 dark:text-white"
                      data-testid="input-room-id"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 glass hover:bg-white/20 text-gray-700 dark:text-gray-300"
                data-testid="button-cancel-join"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                data-testid="button-submit-join"
              >
                Join Room
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
