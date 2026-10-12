import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { WelcomePage } from '@/pages/WelcomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardLayout, type PageKey } from '@/components/DashboardLayout';
import { HomeFeedPage } from '@/pages/HomeFeedPage';
import { DoubtsPage } from '@/pages/DoubtsPage';
import { SeminarsPage } from '@/pages/SeminarsPage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MarketplacePage } from '@/pages/MarketplacePage';

type AuthView = 'welcome' | 'login' | 'signup';
type View = { page: 'feed' } | { page: 'detail'; postId: string };

function AppContent() {
  const { session, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('welcome');
  const [navPage, setNavPage] = useState<PageKey>('home');
  const [view, setView] = useState<View>({ page: 'feed' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    if (authView === 'login') return <LoginPage onSwitch={() => setAuthView('signup')} />;
    if (authView === 'signup') return <SignupPage onSwitch={() => setAuthView('login')} />;
    return (
      <WelcomePage
        onLogin={() => setAuthView('login')}
        onSignup={() => setAuthView('signup')}
      />
    );
  }

  const handleNavigate = (page: PageKey) => {
    setView({ page: 'feed' });
    setNavPage(page);
  };

  const openDetail = (postId: string) => {
    setView({ page: 'detail', postId });
  };

  const backToFeed = () => {
    setView({ page: 'feed' });
  };

  return (
    <DashboardLayout currentPage={navPage} onNavigate={handleNavigate}>
      {view.page === 'detail' ? (
        <PostDetailPage postId={view.postId} onBack={backToFeed} />
      ) : (
        <>
          {navPage === 'home' && <HomeFeedPage onOpenDetail={openDetail} />}
          {navPage === 'doubts' && <DoubtsPage onOpenDetail={openDetail} />}
          {navPage === 'seminars' && <SeminarsPage onOpenDetail={openDetail} />}
          {navPage === 'ai' && <AIAssistantPage />}
          {navPage === 'marketplace' && <MarketplacePage />}
          {navPage === 'profile' && <ProfilePage />}
        </>
      )}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
