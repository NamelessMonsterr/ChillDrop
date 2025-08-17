import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxNDQwMDAsImV4cCI6MTk2MDcyMDAwMH0.placeholder';

// For development, create client only if real credentials are provided
export const supabase = (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) 
  ? null 
  : createClient(supabaseUrl, supabaseKey);

export async function uploadFile(file: File, path: string) {
  if (!supabase) {
    // Mock implementation for development
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
    return { path, fullPath: path };
  }
  
  const { data, error } = await supabase.storage
    .from('files')
    .upload(path, file);
  
  if (error) throw error;
  return data;
}

export async function downloadFile(path: string) {
  if (!supabase) {
    // Mock implementation for development
    throw new Error('File download not available in development mode');
  }
  
  const { data, error } = await supabase.storage
    .from('files')
    .download(path);
  
  if (error) throw error;
  return data;
}

export async function getSignedUrl(path: string, expiresIn = 900) {
  if (!supabase) {
    // Mock implementation for development - return a placeholder URL
    return `https://placeholder.example.com/files/${path}?expires=${Date.now() + expiresIn * 1000}`;
  }
  
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}
