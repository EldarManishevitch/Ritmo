import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, RotateCcw, MessageCircle, Mic, Settings, Flame, LogOut, Music2, User, GraduationCap, Zap, Languages, Library, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProgress, levelForXp } from '@/lib/progress';
import NavDropdown from '@/components/layout/NavDropdown';

const tabs = [
  { path: '/dashboard', icon: Sparkles, label: 'Discover' },
  { path: '/lesson', icon: Zap, label: 'Daily' },
  { path: '/curriculum', icon: GraduationCap, label: 'Curriculum' },
  { path: '/catalog', icon: Library, label: 'Catalog' },
];

const vocabDropdown = [
  { path: '/vocab', icon: BookOpen, label: 'My Words' },
  { path: '/review', icon: RotateCcw, label: 'Review Room' },
];

const practiceDropdown = [
  { path: '/conversations', icon: MessageCircle, label: 'Conversations' },
  { path: '/roleplay', icon: Mic, label: 'Roleplay' },
];

const profileDropdown = [
  { path: '/leaderboard', icon: User, label: 'Profile' },
  { path: '/pricing', icon: CreditCard, label: 'Pricing' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function TopNav() {
  const { pathname } = useLocation();
  const [p, setP] = useState(null);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then((ok) => {
      setAuthed(ok);
      if (ok) getProgress().then(setP).catch(() => {});
    }).catch(() => setAuthed(false));
  }, []);

  const level = p ? levelForXp(p.xp || 0) : null;

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border safe-area-top">
      <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-white">
            <Music2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">Ritmo</span>
        </Link>

        {/* Center nav */}
        {/* No overflow-x-auto here: it forces overflow-y to 'auto' per the CSS spec,
            which clips the NavDropdown menus (absolute, top-full) that hang below this row. */}
        <nav className="flex items-center gap-1 flex-1 justify-center flex-wrap">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
          <NavDropdown icon={BookOpen} label="Vocab" items={vocabDropdown} />
          <NavDropdown icon={Languages} label="Practice" items={practiceDropdown} />
          <NavDropdown icon={User} label="Profile" items={profileDropdown} />
        </nav>

        {/* Right: progress + logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {p && level && (
            <>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{p.current_streak || 0} Days</span>
                <span className="text-xs text-muted-foreground">Best {p.best_streak || 0}</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{level.cefr} · {level.title}</span>
                <span className="text-xs text-muted-foreground">{p.xp || 0} XP</span>
              </div>
            </>
          )}
          {authed ? (
            <button
              onClick={() => base44.auth.logout()}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}