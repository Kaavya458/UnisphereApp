import { useState } from 'react';
import { Heart, MessageCircle, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import type { Post } from '@/lib/types';
import { timeAgo, getAvatarUrl, getPublicFileUrl } from '@/lib/utils';
import { toggleLike } from '@/lib/posts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: Post;
  onPostChanged: () => void;
  onOpenDetail: (postId: string) => void;
}

const TYPE_BADGE: Record<Post['type'], { label: string; class: string }> = {
  general: { label: 'General', class: 'bg-gray-100 text-gray-600' },
  doubt: { label: 'Doubt', class: 'bg-amber-100 text-amber-700' },
  seminar: { label: 'Seminar', class: 'bg-violet-100 text-violet-700' },
};

export function PostCard({ post, onPostChanged, onOpenDetail }: PostCardProps) {
  const { user } = useAuth();
  const [likeAnimating, setLikeAnimating] = useState(false);

  const avatar = getAvatarUrl(post.author?.avatar_url ?? null, post.author?.full_name ?? 'U');
  const badge = TYPE_BADGE[post.type];

  const handleLike = async () => {
    if (!user) return;
    setLikeAnimating(true);
    await toggleLike(post.id, post.liked_by_me ?? false);
    setLikeAnimating(false);
    onPostChanged();
  };

  const handleDelete = async () => {
    await supabase.from('posts').delete().eq('id', post.id);
    onPostChanged();
  };

  const isOwner = user?.id === post.user_id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {avatar.type === 'image' ? (
            <img src={avatar.value} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white text-sm font-semibold">
              {avatar.value}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#111827]">{post.author?.full_name ?? 'Unknown'}</p>
            <p className="text-xs text-gray-400">
              {post.author?.course ?? '—'} • {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.class}`}>
            {badge.label}
          </span>
          {post.is_solved && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

      {/* File */}
      {post.file_url && post.file_type === 'image' && (
        <img
          src={getPublicFileUrl(post.file_url)}
          alt=""
          className="w-full max-h-96 object-cover rounded-xl border border-gray-100 mb-3"
        />
      )}
      {post.file_url && post.file_type === 'pdf' && (
        <a
          href={getPublicFileUrl(post.file_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-[#2563EB] hover:bg-blue-100 transition mb-3"
        >
          <FileText className="w-4 h-4" />
          View attached PDF
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t border-gray-50">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition"
        >
          <Heart
            className={`w-4 h-4 ${likeAnimating ? 'scale-125' : 'scale-100'} transition-transform ${
              post.liked_by_me ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
          <span className={post.liked_by_me ? 'text-red-500 font-medium' : 'text-gray-500'}>
            {post.like_count ?? 0}
          </span>
        </button>
        <button
          onClick={() => onOpenDetail(post.id)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2563EB] transition"
        >
          <MessageCircle className="w-4 h-4" />
          {post.comment_count ?? 0} Comments
        </button>
      </div>
    </div>
  );
}
