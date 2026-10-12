import { useState, useRef } from 'react';
import { User, Mail, BookOpen, Layers, Shield, Save, Loader2, Check, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/posts';
import { getAvatarUrl } from '@/lib/utils';

export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [course, setCourse] = useState(profile?.course ?? '');
  const [semester, setSemester] = useState(profile?.semester ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, course, semester })
      .eq('id', user!.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setEditing(false);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name ?? '');
    setCourse(profile?.course ?? '');
    setSemester(profile?.semester ?? '');
    setEditing(false);
    setError(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    setError(null);

    if (profile?.avatar_url) {
      await supabase.storage.from('uploads').remove([profile.avatar_url]);
    }

    const result = await uploadFile(file, user.id, 'images');
    if (!result) {
      setError('Failed to upload avatar. Please try again.');
      setAvatarUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: result.path })
      .eq('id', user.id);

    setAvatarUploading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
    }
  };

  const avatar = getAvatarUrl(profile?.avatar_url ?? null, profile?.full_name ?? 'U');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-600 flex items-center gap-2">
          <Check className="w-4 h-4" /> Profile updated successfully
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Avatar header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative flex-shrink-0">
          {avatar.type === 'image' ? (
            <img src={avatar.value} alt="" className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white text-3xl font-bold">
              {avatar.value}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-[#111827]">{profile?.full_name}</h2>
          <p className="text-gray-500 text-sm">{profile?.email}</p>
          <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
            profile?.role === 'admin'
              ? 'bg-blue-100 text-[#2563EB]'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {profile?.role === 'admin' ? 'Administrator' : 'Student'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#111827]">Details</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[#2563EB] font-medium hover:underline"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-sm bg-[#2563EB] text-white font-medium hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField icon={User} label="Full Name" value={profile?.full_name ?? ''}
            editing={editing} inputValue={fullName} onInput={setFullName} />
          <DetailField icon={Mail} label="Email" value={profile?.email ?? ''} editing={false} />
          <DetailField icon={BookOpen} label="Course" value={profile?.course ?? ''}
            editing={editing} inputValue={course} onInput={setCourse} />
          <DetailField icon={Layers} label="Semester" value={profile?.semester ?? ''}
            editing={editing} inputValue={semester} onInput={setSemester} />
          <DetailField icon={Shield} label="Role" value={profile?.role ?? 'student'} editing={false} />
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  editing,
  inputValue,
  onInput,
}: {
  icon: typeof User;
  label: string;
  value: string;
  editing: boolean;
  inputValue?: string;
  onInput?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {editing && onInput ? (
          <input
            type="text"
            value={inputValue ?? ''}
            onChange={(e) => onInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-[#111827] text-sm"
          />
        ) : (
          <div className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-sm text-[#111827] capitalize">
            {value || '—'}
          </div>
        )}
      </div>
    </div>
  );
}
