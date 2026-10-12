import { supabase } from '@/lib/supabase';

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function getPublicFileUrl(path: string): string {
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}

export function getAvatarUrl(avatarUrl: string | null, name: string): { type: 'image' | 'initial'; value: string } {
  if (avatarUrl) {
    const { data } = supabase.storage.from('uploads').getPublicUrl(avatarUrl);
    if (data.publicUrl) return { type: 'image', value: data.publicUrl };
  }
  return { type: 'initial', value: getInitials(name) };
}
