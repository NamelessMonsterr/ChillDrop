import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  expiryHours: z.enum(["1", "6", "12", "24"]),
  password: z.string().optional(),
});

type CreateRoomData = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: (roomId: string) => void;
}

export function CreateRoomModal({ open, onOpenChange, onRoomCreated }: CreateRoomModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateRoomData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      expiryHours: "12",
      password: "",
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomData) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      return response.json();
    },
    onSuccess: (room) => {
      toast({
        title: "Room Created",
        description: "Your secure room has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      onRoomCreated(room.id);
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateRoomData) => {
    createRoomMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-none shadow-2xl max-w-md animate-slide-up" data-testid="modal-create-room">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Room
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Set up your temporary secure workspace
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Project Alpha"
                      className="glass border-none text-gray-900 dark:text-white"
                      data-testid="input-room-name"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiryHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expires After
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass border-none text-gray-900 dark:text-white" data-testid="select-expiry">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password"
                      placeholder="Leave empty for no password"
                      className="glass border-none text-gray-900 dark:text-white"
                      data-testid="input-password"
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
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRoomMutation.isPending}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                data-testid="button-submit-create"
              >
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
