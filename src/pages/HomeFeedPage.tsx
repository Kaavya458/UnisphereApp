import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { CreatePostBox } from '@/components/CreatePostBox';
import { PostCard } from '@/components/PostCard';
import { fetchPosts } from '@/lib/posts';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/lib/types';

type Tab = 'all' | 'doubt' | 'seminar';

interface HomeFeedPageProps {
  onOpenDetail: (postId: string) => void;
}

export function HomeFeedPage({ onOpenDetail }: HomeFeedPageProps) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const typeFilter = tab === 'all' ? undefined : tab;
    const data = await fetchPosts({ typeFilter });
    setPosts(data);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'doubt', label: 'Doubts' },
    { key: 'seminar', label: 'Seminars' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <CreatePostBox onPostCreated={loadPosts} allowSeminar={profile?.role === 'admin'} />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-[#2563EB] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
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
