import { useQuery } from "@tanstack/react-query";
import type { File } from "@shared/schema";

export function useFiles(roomId: string | undefined) {
  const { data: files = [], isLoading, error } = useQuery<File[]>({
    queryKey: ["/api/rooms", roomId, "files"],
    enabled: !!roomId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const fileCount = files.length;
  const totalSize = files.reduce((acc, file) => acc + file.fileSize, 0);

  const formatTotalSize = () => {
    if (totalSize === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(totalSize) / Math.log(k));
    return parseFloat((totalSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    files,
    fileCount,
    totalSize: formatTotalSize(),
    isLoading,
    error: error as Error | null,
  };
}
