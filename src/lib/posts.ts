import { supabase } from '@/lib/supabase';
import type { Post, Comment, Profile } from '@/lib/types';

export async function fetchProfiles(userIds: string[]): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>();
  if (userIds.length === 0) return map;
  const unique = [...new Set(userIds)];
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('id', unique);
  if (data) {
    for (const p of data as Profile[]) {
      map.set(p.id, p);
    }
  }
  return map;
}

export interface FetchPostsOptions {
  typeFilter?: 'general' | 'doubt' | 'seminar';
  solvedFilter?: 'solved' | 'unsolved';
  limit?: number;
}

export async function fetchPosts(opts: FetchPostsOptions = {}): Promise<Post[]> {
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (opts.typeFilter) {
    query = query.eq('type', opts.typeFilter);
  }
  if (opts.solvedFilter === 'solved') {
    query = query.eq('is_solved', true);
  } else if (opts.solvedFilter === 'unsolved') {
    query = query.eq('is_solved', false);
  }
  if (opts.limit) {
    query = query.limit(opts.limit);
  }
  const { data: posts, error } = await query;
  if (error || !posts) return [];

  const enriched = await enrichPosts(posts as Post[]);
  return enriched;
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  const enriched = await enrichPosts([data as Post]);
  return enriched[0] ?? null;
}

export async function enrichPosts(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return [];

  const userIds = posts.map((p) => p.user_id);
  const profileMap = await fetchProfiles(userIds);

  const postIds = posts.map((p) => p.id);

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
  ]);

  const likeMap = new Map<string, number>();
  const likedByMe = new Set<string>();
  const currentUser = (await supabase.auth.getUser()).data.user?.id;

  if (likes) {
    for (const l of likes) {
      likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1);
      if (l.user_id === currentUser) likedByMe.add(l.post_id);
    }
  }

  const commentMap = new Map<string, number>();
  if (comments) {
    for (const c of comments) {
      commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);
    }
  }

  return posts.map((p) => ({
    ...p,
    author: profileMap.get(p.user_id),
    like_count: likeMap.get(p.id) ?? 0,
    comment_count: commentMap.get(p.id) ?? 0,
    liked_by_me: likedByMe.has(p.id),
  }));
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];

  const userIds = (data as Comment[]).map((c) => c.user_id);
  const profileMap = await fetchProfiles(userIds);

  return (data as Comment[]).map((c) => ({
    ...c,
    author: profileMap.get(c.user_id),
  }));
}

export async function uploadFile(
  file: File,
  userId: string,
  category: 'images' | 'pdfs'
): Promise<{ path: string; publicUrl: string } | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${category}/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('uploads').upload(fileName, file);
  if (error) return null;

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return { path: fileName, publicUrl: data.publicUrl };
}

export async function toggleLike(postId: string, currentlyLiked: boolean): Promise<void> {
  if (currentlyLiked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', (await supabase.auth.getUser()).data.user!.id);
  } else {
    await supabase.from('likes').insert({ post_id: postId });
  }
}

export async function createComment(postId: string, content: string): Promise<void> {
  await supabase.from('comments').insert({ post_id: postId, content });
}

export async function markCommentAccepted(postId: string, commentId: string): Promise<void> {
  await supabase.from('comments').update({ is_accepted: true }).eq('id', commentId);
  await supabase.from('posts').update({ is_solved: true, solved_comment_id: commentId }).eq('id', postId);
}
