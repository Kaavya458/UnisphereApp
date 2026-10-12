import {
  Home,
  HelpCircle,
  Calendar,
  Bot,
  UserCircle,
  GraduationCap,
  LogOut,
  Search,
  Menu,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/utils';

export type PageKey = 'home' | 'doubts' | 'seminars' | 'ai' | 'marketplace' | 'profile';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'doubts', label: 'Doubts', icon: HelpCircle },
  { key: 'seminars', label: 'Seminars', icon: Calendar },
  { key: 'ai', label: 'AI Assistant', icon: Bot },
  { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { key: 'profile', label: 'Profile', icon: UserCircle },
];

interface DashboardLayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function DashboardLayout({ currentPage, onNavigate, children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (page: PageKey) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const avatar = getAvatarUrl(profile?.avatar_url ?? null, profile?.full_name ?? 'U');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#111827]">UniSphere</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 z-20">
          <div className="flex items-center gap-3 flex-1">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                {avatar.type === 'image' ? (
                  <img src={avatar.value} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white text-sm font-semibold">
                    {avatar.value}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-[#111827] max-w-[120px] truncate">
                  {profile?.full_name ?? 'User'}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-40">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-medium text-[#111827] truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                        profile?.role === 'admin'
                          ? 'bg-blue-100 text-[#2563EB]'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {profile?.role ?? 'student'}
                      </span>
                    </div>
                    <button
                      onClick={() => { handleNavigate('profile'); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      <UserCircle className="w-4 h-4" /> My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
