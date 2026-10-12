import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, FileText, CheckCircle2, Send, Loader2, Trash2 } from 'lucide-react';
import { fetchPostById, fetchComments, createComment, markCommentAccepted, toggleLike } from '@/lib/posts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, getAvatarUrl, getPublicFileUrl } from '@/lib/utils';
import type { Post, Comment } from '@/lib/types';

interface PostDetailPageProps {
  postId: string;
  onBack: () => void;
}

const TYPE_BADGE: Record<Post['type'], { label: string; class: string }> = {
  general: { label: 'General', class: 'bg-gray-100 text-gray-600' },
  doubt: { label: 'Doubt', class: 'bg-amber-100 text-amber-700' },
  seminar: { label: 'Seminar', class: 'bg-violet-100 text-violet-700' },
};

export function PostDetailPage({ postId, onBack }: PostDetailPageProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const loadAll = useCallback(async () => {
    const [p, c] = await Promise.all([
      fetchPostById(postId),
      fetchComments(postId),
    ]);
    setPost(p);
    setComments(c);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    await createComment(postId, commentText.trim());
    setCommentText('');
    setSubmitting(false);
    await loadAll();
  };

  const handleMarkAccepted = async (commentId: string) => {
    await markCommentAccepted(postId, commentId);
    await loadAll();
  };

  const handleLike = async () => {
    if (!user || !post) return;
    setLikeAnimating(true);
    await toggleLike(post.id, post.liked_by_me ?? false);
    setLikeAnimating(false);
    await loadAll();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    await loadAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2563EB] transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Post not found.</p>
        </div>
      </div>
    );
  }

  const avatar = getAvatarUrl(post.author?.avatar_url ?? null, post.author?.full_name ?? 'U');
  const badge = TYPE_BADGE[post.type];
  const isPostAuthor = user?.id === post.user_id;
  const isDoubt = post.type === 'doubt';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2563EB] transition">
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </button>

      {/* Post */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.class}`}>{badge.label}</span>
            {post.is_solved && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {post.file_url && post.file_type === 'image' && (
          <img src={getPublicFileUrl(post.file_url)} alt="" className="w-full max-h-96 object-cover rounded-xl border border-gray-100 mb-3" />
        )}
        {post.file_url && post.file_type === 'pdf' && (
          <a
            href={getPublicFileUrl(post.file_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-[#2563EB] hover:bg-blue-100 transition mb-3"
          >
            <FileText className="w-4 h-4" /> View attached PDF
          </a>
        )}

        <div className="flex items-center gap-5 pt-3 border-t border-gray-50">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-sm transition">
            <Heart
              className={`w-4 h-4 ${likeAnimating ? 'scale-125' : 'scale-100'} transition-transform ${
                post.liked_by_me ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
            <span className={post.liked_by_me ? 'text-red-500 font-medium' : 'text-gray-500'}>
              {post.like_count ?? 0}
            </span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4" />
            {comments.length} {isDoubt ? 'Answers' : 'Comments'}
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-[#111827] mb-4">
          {isDoubt ? 'Answers' : 'Comments'} ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {isDoubt ? 'No answers yet. Be the first to help!' : 'No comments yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const cAvatar = getAvatarUrl(comment.author?.avatar_url ?? null, comment.author?.full_name ?? 'U');
              const isCommentAuthor = user?.id === comment.user_id;
              return (
                <div
                  key={comment.id}
                  className={`rounded-xl p-4 ${
                    comment.is_accepted
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  {comment.is_accepted && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Answer
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {cAvatar.type === 'image' ? (
                      <img src={cAvatar.value} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {cAvatar.value}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#111827]">{comment.author?.full_name ?? 'Unknown'}</p>
                        <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mt-1">{comment.content}</p>

                      <div className="flex items-center gap-3 mt-2">
                        {isPostAuthor && isDoubt && !comment.is_accepted && !post.is_solved && (
                          <button
                            onClick={() => handleMarkAccepted(comment.id)}
                            className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as solved
                          </button>
                        )}
                        {isCommentAuthor && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add comment */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder={isDoubt ? 'Write an answer...' : 'Write a comment...'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827]"
          />
          <button
            onClick={handleComment}
            disabled={submitting || !commentText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDoubt ? 'Answer' : 'Comment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
