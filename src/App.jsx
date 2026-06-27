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
import LanguageRouteGuard from '@/components/LanguageRouteGuard';
import PageTransition from '@/components/PageTransition';
import AppShell from '@/components/layout/AppShell';
import { LanguageProvider } from '@/lib/LanguageContext';
import LanguageSelect from '@/pages/LanguageGateway';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Page imports
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import TestPage from './pages/TestPage';
import SongPage from './pages/SongPage';
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
import About from './pages/About';
import Contact from './pages/Contact';

const AuthenticatedApp = () => {
  const { isAuthenticated, authError, authChecked } = useAuth();

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <LanguageProvider>
    <Routes>
      {/* Step 1: Public auth gate and auth pages */}
      <Route path="/" element={<TestPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public blog/SEO pages (auth optional, visible to all) */}
      <Route path="/how-to-learn-spanish-with-music" element={<HowToLearnSpanishWithMusic />} />
      <Route path="/reggaeton-slang-guide" element={<ReggaetonSlangGuide />} />
      <Route path="/dominican-slang-guide" element={<DominicanSlangGuide />} />
      <Route path="/best-reggaeton-songs" element={<BestReggaetonSongs />} />
      <Route path="/best-bachata-songs" element={<BestBachataSongs />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Step 2: Language selection (requires auth) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/language-select" element={<LanguageSelect />} />

        {/* Step 3: Main app (requires auth + language selection) */}
        <Route element={<LanguageRouteGuard />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/roleplay" element={<Roleplay />} />
            <Route path="/review" element={<ReviewRoom />} />
            <Route path="/vocab" element={<Vocab />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/song/:id" element={<PageTransition><SongPage /></PageTransition>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </LanguageProvider>
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