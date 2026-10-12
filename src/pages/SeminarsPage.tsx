import { useState, useEffect, useCallback } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import { CreatePostBox } from '@/components/CreatePostBox';
import { PostCard } from '@/components/PostCard';
import { fetchPosts } from '@/lib/posts';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/lib/types';

interface SeminarsPageProps {
  onOpenDetail: (postId: string) => void;
}

export function SeminarsPage({ onOpenDetail }: SeminarsPageProps) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await fetchPosts({ typeFilter: 'seminar' });
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Seminars</h1>
          <p className="text-sm text-gray-500">Latest seminars and events, newest first</p>
        </div>
      </div>

      {profile?.role === 'admin' && (
        <CreatePostBox onPostCreated={loadPosts} forceType="seminar" />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No seminars posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onPostChanged={loadPosts} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      )}
    </div>
  );
}
