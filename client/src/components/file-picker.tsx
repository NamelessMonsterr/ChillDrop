import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";

interface FilePickerProps {
  onFileSelect: (files: File[]) => void;
}

export function FilePicker({ onFileSelect }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="*/*" // Accept all file types
      />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleClick}
        className="hover:bg-white/20 rounded transition-all" 
        data-testid="button-file-picker"
      >
        <Paperclip className="h-4 w-4 text-gray-500" />
      </Button>
    </>
  );
}