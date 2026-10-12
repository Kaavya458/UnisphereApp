import { supabase } from '@/lib/supabase';
import { fetchProfiles, uploadFile } from '@/lib/posts';
import type { MarketplaceListing, Profile } from '@/lib/types';

export async function fetchListings(categoryFilter?: string): Promise<MarketplaceListing[]> {
  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (categoryFilter && categoryFilter !== 'All') {
    query = query.eq('category', categoryFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const listings = data as MarketplaceListing[];
  if (listings.length === 0) return [];

  const userIds = listings.map((l) => l.user_id);
  const profileMap = await fetchProfiles(userIds);

  return listings.map((l) => ({
    ...l,
    author: profileMap.get(l.user_id),
  }));
}

export async function createListing(params: {
  title: string;
  description: string;
  price: number;
  category: string;
  imageFile: File | null;
  userId: string;
}): Promise<{ error: string | null }> {
  let imageUrl: string | null = null;

  if (params.imageFile) {
    const result = await uploadFile(params.imageFile, params.userId, 'images');
    if (!result) {
      return { error: 'Failed to upload image. Please try again.' };
    }
    imageUrl = result.path;
  }

  const { error: insertError } = await supabase.from('marketplace_listings').insert({
    title: params.title,
    description: params.description,
    price: params.price,
    category: params.category,
    image_url: imageUrl,
  });

  if (insertError) return { error: insertError.message };
  return { error: null };
}

export async function deleteListing(id: string): Promise<void> {
  await supabase.from('marketplace_listings').delete().eq('id', id);
}

export async function markListingSold(id: string): Promise<void> {
  await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', id);
}
