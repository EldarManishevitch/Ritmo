import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import AppShell from '@/components/layout/AppShell';
import RootGate from '@/components/RootGate';
import OnboardingWizard from '@/components/OnboardingWizard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Page imports
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Lesson from './pages/Lesson';
import CertificatePage from './pages/CertificatePage';
import SongPage from './pages/SongPage';
import SongPending from './pages/SongPending';
import Conversations from './pages/Conversations';
import Roleplay from './pages/Roleplay';
import ReviewRoom from './pages/ReviewRoom';
import Settings from './pages/Settings';
import Vocab from './pages/Vocab';
import Leaderboard from './pages/Leaderboard';
import HowToLearnSpanishWithMusic from './pages/HowToLearnSpanishWithMusic';
import ReggaetonSlangGuide from './pages/ReggaetonSlangGuide';
import DominicanSlangGuide from './pages/DominicanSlangGuide';
import BestReggaetonSongs from './pages/BestReggaetonSongs';
import BestBachataSongs from './pages/BestBachataSongs';
import CompareDuolingo from './pages/CompareDuolingo';
import CompareLingopie from './pages/CompareLingopie';
import CompareLyricsTraining from './pages/CompareLyricsTraining';
import ArtistSpotlight from './pages/ArtistSpotlight';
import SlangTermPage from './pages/SlangTermPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Catalog from './pages/Catalog';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootGate landing={<Landing />} dashboard={<Navigate to="/dashboard" replace />} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/certificate/:level" element={<CertificatePage />} />

      {/* Public blog/SEO pages */}
      <Route path="/how-to-learn-spanish-with-music" element={<HowToLearnSpanishWithMusic />} />
      <Route path="/reggaeton-slang-guide" element={<ReggaetonSlangGuide />} />
      <Route path="/dominican-slang-guide" element={<DominicanSlangGuide />} />
      <Route path="/best-reggaeton-songs" element={<BestReggaetonSongs />} />
      <Route path="/best-bachata-songs" element={<BestBachataSongs />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Comparison pages */}
      <Route path="/compare/spanish-beats-vs-duolingo" element={<CompareDuolingo />} />
      <Route path="/compare/spanish-beats-vs-lingopie" element={<CompareLingopie />} />
      <Route path="/compare/spanish-beats-vs-lyrics-training" element={<CompareLyricsTraining />} />

      {/* Artist spotlight pages */}
      <Route path="/learn-spanish-with/bad-bunny" element={<ArtistSpotlight slug="bad-bunny" />} />
      <Route path="/learn-spanish-with/aventura" element={<ArtistSpotlight slug="aventura" />} />
      <Route path="/learn-spanish-with/karol-g" element={<ArtistSpotlight slug="karol-g" />} />

      {/* Slang term pages */}
      <Route path="/slang/:term" element={<SlangTermPage />} />

      {/* Authenticated app */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lesson" element={<PageTransition><Lesson /></PageTransition>} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/roleplay" element={<Roleplay />} />
          <Route path="/review" element={<ReviewRoom />} />
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/song/:id" element={<PageTransition><SongPage /></PageTransition>} />
        <Route path="/song/pending/:youtubeId" element={<PageTransition><SongPending /></PageTransition>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App