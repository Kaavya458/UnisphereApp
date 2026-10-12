import { GraduationCap } from 'lucide-react';

export function WelcomePage({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-blue-50 flex flex-col">
      <nav className="px-6 py-5 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#111827]">UniSphere</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#2563EB] shadow-xl shadow-blue-200 mb-8">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] leading-tight mb-4">
            UniSphere
          </h1>
          <p className="text-xl text-[#2563EB] font-semibold mb-6">
            One platform. One student community.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Everything a college student needs in one place — study resources, AI-powered assistance,
            event updates, job opportunities, a marketplace, and a vibrant community. Connect, learn, and grow together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#2563EB] text-white font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Login
            </button>
            <button
              onClick={onSignup}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white text-[#2563EB] font-medium border border-blue-200 hover:bg-blue-50 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400">
        UniSphere — Built for students, by students
      </footer>
    </div>
  );
}
