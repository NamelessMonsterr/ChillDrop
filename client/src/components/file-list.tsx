import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Folder, Search, Download, Eye, Share, FileText, Image, Video, Archive, DownloadCloud } from "lucide-react";
import { getSignedUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

interface FileListProps {
  roomId: string;
  onShareFile?: (file: File) => void;
}

export function FileList({ roomId, onShareFile }: FileListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/rooms", roomId, "files"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleBulkDownload = async () => {
    if (filteredFiles.length === 0) return;
    
    try {
      for (const file of filteredFiles) {
        const signedUrl = await getSignedUrl(file.storagePath);
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast({
        title: "Bulk Download Started",
        description: `Downloading ${filteredFiles.length} files`,
      });
    } catch (error) {
      toast({
        title: "Bulk Download Failed",
        description: "Failed to download some files",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
    if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
    return FileText;
  };

  const getFileIconColor = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "from-green-500 to-teal-600";
    if (mimeType.startsWith("video/")) return "from-red-500 to-pink-600";
    if (mimeType.includes("pdf")) return "from-red-500 to-red-600";
    if (mimeType.includes("excel") || mimeType.includes("sheet")) return "from-green-500 to-emerald-600";
    if (mimeType.includes("word") || mimeType.includes("document")) return "from-blue-500 to-indigo-600";
    return "from-gray-500 to-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInMs = now.getTime() - uploadDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMins > 0) return `${diffInMins}m ago`;
    return "Just now";
  };

  const formatExpiresIn = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInMs = expiry.getTime() - now.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInHours > 0) return `${diffInHours}h`;
    if (diffInMins > 0) return `${diffInMins}m`;
    return "Expired";
  };

  const handleDownload = async (file: File) => {
    try {
      const signedUrl = await getSignedUrl(file.storagePath);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${file.filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (file: File) => {
    try {
      const signedUrl = await getSignedUrl(file.storagePath);
      window.open(signedUrl, '_blank');
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to preview file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6" data-testid="file-list-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          <Folder className="inline mr-2 text-primary-500" />
          Files ({files.length})
        </h2>
        <div className="flex items-center gap-2">
          {filteredFiles.length > 1 && (
            <Button 
              onClick={handleBulkDownload}
              variant="ghost" 
              size="sm" 
              className="glass hover:bg-white/20 text-primary-500"
              data-testid="button-bulk-download"
            >
              <DownloadCloud className="h-4 w-4 mr-1" />
              Download All
            </Button>
          )}
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 glass border-none text-sm"
            data-testid="input-search-files"
          />
          <Button variant="ghost" size="icon" className="glass">
            <Search className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
      
      {filteredFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? "No files match your search" : "No files uploaded yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => {
            const IconComponent = getFileIcon(file.mimeType);
            const iconColorClass = getFileIconColor(file.mimeType);
            
            return (
              <div 
                key={file.id} 
                className="file-preview rounded-xl p-4 hover:bg-white/10 transition-all group"
                data-testid={`file-item-${file.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${iconColorClass} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.filename}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.fileSize)} • {formatTimeAgo(file.createdAt.toString())} • Expires in {formatExpiresIn(file.expiresAt.toString())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(file)}
                      className="glass hover:bg-white/20 transition-all"
                      title="Preview"
                      data-testid={`button-preview-${file.id}`}
                    >
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      className="glass hover:bg-white/20 transition-all"
                      title="Download"
                      data-testid={`button-download-${file.id}`}
                    >
                      <Download className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShareFile?.(file)}
                      className="glass hover:bg-white/20 transition-all"
                      title="Share in chat"
                      data-testid={`button-share-${file.id}`}
                    >
                      <Share className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
