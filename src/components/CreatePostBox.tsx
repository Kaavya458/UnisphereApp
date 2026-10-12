import { useState, useRef } from 'react';
import { ImagePlus, FileText, Send, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/posts';
import { useAuth } from '@/hooks/useAuth';
import type { PostType } from '@/lib/types';

interface CreatePostBoxProps {
  onPostCreated: () => void;
  forceType?: PostType;
  allowSeminar?: boolean;
}

export function CreatePostBox({ onPostCreated, forceType, allowSeminar = false }: CreatePostBoxProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>(forceType ?? 'general');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileImageRef = useRef<HTMLInputElement>(null);
  const filePdfRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    const result = await uploadFile(file, user.id, 'images');
    setUploading(false);
    if (result) {
      setImageUrl(result.path);
      setImagePreview(result.publicUrl);
    } else {
      setError('Failed to upload image. Please try again.');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    const result = await uploadFile(file, user.id, 'pdfs');
    setUploading(false);
    if (result) {
      setPdfUrl(result.path);
      setPdfName(file.name);
    } else {
      setError('Failed to upload PDF. Please try again.');
    }
  };

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError(null);

    const fileUrl = imageUrl ?? pdfUrl;
    const fileType = imageUrl ? 'image' : pdfUrl ? 'pdf' : null;

    const { error: insertError } = await supabase.from('posts').insert({
      type,
      content: content.trim(),
      file_url: fileUrl,
      file_type: fileType,
    });

    setPosting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setContent('');
      setType(forceType ?? 'general');
      setImageUrl(null);
      setImagePreview(null);
      setPdfUrl(null);
      setPdfName(null);
      onPostCreated();
    }
  };

  const typeOptions: PostType[] = allowSeminar
    ? ['general', 'doubt', 'seminar']
    : ['general', 'doubt'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share something with your community..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827] resize-none"
        />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="mt-3 relative inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl border border-gray-100" />
          <button
            onClick={() => { setImagePreview(null); setImageUrl(null); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
          >
            ✕
          </button>
        </div>
      )}

      {/* PDF preview */}
      {pdfName && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          <span className="text-sm text-[#111827] truncate flex-1">{pdfName}</span>
          <button
            onClick={() => { setPdfName(null); setPdfUrl(null); }}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input ref={fileImageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={filePdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
          <button
            onClick={() => fileImageRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4" /> Image
          </button>
          <button
            onClick={() => filePdfRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          {uploading && <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />}
        </div>

        <div className="flex items-center gap-2">
          {!forceType && (
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PostType)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border border-gray-200 bg-white text-[#111827] focus:border-[#2563EB] outline-none cursor-pointer"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
