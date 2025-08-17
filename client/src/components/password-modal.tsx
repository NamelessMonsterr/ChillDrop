import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type PasswordData = z.infer<typeof passwordSchema>;

interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onPasswordValidated: () => void;
}

export function PasswordModal({ open, onOpenChange, roomId, onPasswordValidated }: PasswordModalProps) {
  const { toast } = useToast();
  
  const form = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: PasswordData) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/validate-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.valid) {
        onPasswordValidated();
        onOpenChange(false);
        form.reset();
      } else {
        toast({
          title: "Incorrect Password",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate password",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-none shadow-2xl max-w-md animate-slide-up" data-testid="modal-password">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white text-2xl" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Room is Protected
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300">
            This room requires a password to access
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password"
                      placeholder="Enter room password"
                      className="glass border-none text-gray-900 dark:text-white"
                      data-testid="input-room-password"
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
                data-testid="button-cancel-password"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                data-testid="button-submit-password"
              >
                Access Room
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
