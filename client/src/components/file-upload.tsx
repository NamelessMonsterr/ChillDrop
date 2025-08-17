import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, X, File, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";

// Helper functions for upload stats
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

const formatETA = (seconds: number): string => {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${Math.ceil(seconds / 3600)}h`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error" | "cancelled";
  uploadSpeed?: string;
  eta?: string;
  cancelFn?: () => void;
}

interface FileUploadProps {
  roomId: string;
}

export function FileUpload({ roomId }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, uploadingId }: { file: File; uploadingId: string }) => {
      const startTime = Date.now();
      let cancelled = false;
      
      // Update file status with cancel function
      const updateProgress = (progress: number, speed?: string, eta?: string) => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingId ? { 
            ...f, 
            progress, 
            uploadSpeed: speed,
            eta: eta,
            cancelFn: () => { cancelled = true; }
          } : f)
        );
      };

      // Upload to Supabase Storage with progress simulation
      const fileName = `${Date.now()}-${file.name}`;
      const storagePath = `${roomId}/${fileName}`;
      
      // Simulate chunked upload with realistic progress
      const totalSize = file.size;
      const chunkSize = Math.min(1024 * 1024, totalSize / 10); // 1MB chunks or 10% of file
      
      for (let progress = 0; progress <= 100; progress += 10) {
        if (cancelled) {
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingId ? { ...f, status: "cancelled" } : f)
          );
          throw new Error('Upload cancelled');
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        const uploadedBytes = (progress / 100) * totalSize;
        const speed = uploadedBytes / elapsed;
        const remainingBytes = totalSize - uploadedBytes;
        const eta = speed > 0 ? remainingBytes / speed : 0;
        
        const speedStr = formatSpeed(speed);
        const etaStr = formatETA(eta);
        
        updateProgress(progress, speedStr, etaStr);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }

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
      updateProgress(100, "Complete", "0s");
      
      return response.json();
    },
    onSuccess: (_, { uploadingId }) => {
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingId ? { ...f, status: "complete" } : f)
      );
      
      // Remove completed file after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
      }, 2000);

      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "files"] });
      
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully",
      });
    },
    onError: (_, { uploadingId }) => {
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingId ? { ...f, status: "error" } : f)
      );
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxSize = 250 * 1024 * 1024; // 250MB

    acceptedFiles.forEach(file => {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 250MB limit`,
          variant: "destructive",
        });
        return;
      }

      const uploadingId = `${Date.now()}-${Math.random()}`;
      const uploadingFile: UploadingFile = {
        id: uploadingId,
        file,
        progress: 0,
        status: "uploading",
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);
      uploadFileMutation.mutate({ file, uploadingId });
    });
  }, [uploadFileMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 250 * 1024 * 1024, // 250MB
  });

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="glass rounded-2xl p-6" data-testid="file-upload-section">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        <CloudUpload className="inline mr-2 text-primary-500" />
        Upload Files
      </h2>
      
      <div 
        {...getRootProps()} 
        className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? "drag-over" : ""
        }`}
        data-testid="dropzone"
      >
        <input {...getInputProps()} />
        <div className="mb-4">
          <CloudUpload className="mx-auto text-4xl text-primary-500 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-gray-600 dark:text-gray-300">or click to browse</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Max 250MB per file</p>
        </div>
      </div>
      
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-3" data-testid="upload-progress">
          {uploadingFiles.map((upload) => (
            <div key={upload.id} className="file-preview rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <File className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white block">
                      {upload.file.name}
                    </span>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(upload.file.size)}</span>
                      {upload.uploadSpeed && <span>{upload.uploadSpeed}</span>}
                      {upload.eta && upload.status === "uploading" && <span>ETA: {upload.eta}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === "uploading" && upload.cancelFn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={upload.cancelFn}
                      className="h-6 w-6 hover:bg-red-500 hover:text-white"
                      data-testid={`button-cancel-${upload.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  {upload.status === "complete" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUploadingFile(upload.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-${upload.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {upload.status === "uploading" && (
                <>
                  <Progress value={upload.progress} className="mb-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{upload.progress}% complete</span>
                    <span>{upload.uploadSpeed || "Calculating..."}</span>
                  </div>
                </>
              )}
              
              {upload.status === "complete" && (
                <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload complete
                </div>
              )}
              
              {upload.status === "error" && (
                <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <X className="h-3 w-3 mr-1" />
                  Upload failed - <button className="underline ml-1" onClick={() => uploadFileMutation.mutate({ file: upload.file, uploadingId: upload.id })}>Retry</button>
                </div>
              )}
              
              {upload.status === "cancelled" && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <X className="h-3 w-3 mr-1" />
                  Upload cancelled
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
