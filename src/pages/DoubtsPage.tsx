import { useState, useEffect, useCallback } from 'react';
import { Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { fetchPosts } from '@/lib/posts';
import type { Post } from '@/lib/types';

type Filter = 'all' | 'solved' | 'unsolved';

interface DoubtsPageProps {
  onOpenDetail: (postId: string) => void;
}

export function DoubtsPage({ onOpenDetail }: DoubtsPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const solvedFilter = filter === 'all' ? undefined : filter;
    const data = await fetchPosts({ typeFilter: 'doubt', solvedFilter });
    setPosts(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Doubts' },
    { key: 'unsolved', label: 'Unsolved' },
    { key: 'solved', label: 'Solved' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Doubts</h1>
          <p className="text-sm text-gray-500">Ask questions and help others find answers</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-[#2563EB] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No doubts found.</p>
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
