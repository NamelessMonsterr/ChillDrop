import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('files')
    .upload(path, file);
  
  if (error) throw error;
  return data;
}

export async function downloadFile(path: string) {
  const { data, error } = await supabase.storage
    .from('files')
    .download(path);
  
  if (error) throw error;
  return data;
}

export async function getSignedUrl(path: string, expiresIn = 900) {
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}
