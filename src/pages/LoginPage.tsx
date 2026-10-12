import { useState } from 'react';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Welcome back</h1>
          <p className="text-gray-500 mt-1">Log in to your UniSphere account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-[#111827] text-sm"
                  placeholder="jane@university.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-[#111827] text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Log In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <button onClick={onSwitch} className="text-[#2563EB] font-medium hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
