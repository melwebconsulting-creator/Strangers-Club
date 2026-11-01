import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  MessageCircle,
  HeartHandshake,
  Gamepad2,
  CheckSquare,
  Trophy,
  Search,
  Bell,
  Crown,
  LogIn,
  UserPlus,
  Menu,
  X,
  Home,
  User as UserIcon,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const { currentUser, isAuthenticated, isOwner } = useAuth();
  const { config } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pending registrations count for owner badge
  const pendingRequestsCount = isOwner
    ? StorageService.getRegistrationRequests().filter((r) => r.status === 'pending').length
    : 0;

  const navItems = [
    { id: 'home', label: config.navigationLabels.home || 'Home', icon: Home, enabled: config.enabledSections.home },
    { id: 'confessions', label: config.navigationLabels.confessions || 'Confessions', icon: HeartHandshake, enabled: config.enabledSections.confessions },
    { id: 'chat', label: config.navigationLabels.chat || 'Chat Room', icon: MessageCircle, enabled: config.enabledSections.chat },
    { id: 'games', label: config.navigationLabels.games || 'Games', icon: Gamepad2, enabled: config.enabledSections.games },
    { id: 'tasks', label: config.navigationLabels.tasks || 'Daily Quests', icon: CheckSquare, enabled: config.enabledSections.tasks },
    { id: 'leaderboard', label: config.navigationLabels.leaderboard || 'Ranks', icon: Trophy, enabled: config.enabledSections.leaderboard },
  ].filter((item) => item.enabled !== false);

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-pink-100 shadow-xs transition-all">
      {/* Top Cute Announcement Bar if enabled */}
      {config.announcementBanner?.enabled && config.announcementBanner?.text && (
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 text-white text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs">
          <span>{config.announcementBanner.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-xl shadow-md shadow-pink-200 group-hover:scale-105 transition-transform">
              {config.logoEmoji || '🌸'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl text-slate-800 tracking-tight group-hover:text-pink-600 transition-colors">
                  {config.siteName}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600">
                  Club
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-[200px]">
                {config.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-pink-50/60 p-1.5 rounded-2xl border border-pink-100/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-pink-600 shadow-xs scale-102 font-bold'
                      : 'text-slate-600 hover:text-pink-600 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            {config.enabledSections.search !== false && (
              <button
                onClick={onOpenSearch}
                aria-label="Search"
                className="p-2.5 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                title="Search Club"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              aria-label="Notifications"
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {(unreadNotificationsCount > 0 || (isOwner && pendingRequestsCount > 0)) && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                  {unreadNotificationsCount + (isOwner ? pendingRequestsCount : 0)}
                </span>
              )}
            </button>

            {/* Owner Control Panel Link (Visible if Owner) */}
            {isOwner && (
              <button
                onClick={() => handleTabClick('owner')}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  currentTab === 'owner'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-2 ring-purple-300'
                    : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Owner Control Panel"
              >
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="hidden sm:inline">Owner Panel</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Actions / Profile Avatar */}
            {isAuthenticated && currentUser ? (
              <button
                onClick={() => handleTabClick('profile')}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl border transition-all cursor-pointer ${
                  currentTab === 'profile'
                    ? 'border-pink-400 bg-pink-50 shadow-xs'
                    : 'border-slate-200 hover:border-pink-300 hover:bg-pink-50/50'
                }`}
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full bg-pink-100 object-cover ring-2 ring-pink-300"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-pink-600 font-semibold leading-tight">
                    Lv. {currentUser.level} {currentUser.rankTitle}
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-sm shadow-pink-200 transition-all hover:scale-102 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Club</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 md:hidden hover:bg-pink-50 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-pink-100/80 text-pink-700'
                      : 'bg-slate-50 text-slate-700 hover:bg-pink-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {isAuthenticated && (
            <button
              onClick={() => handleTabClick('profile')}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-pink-50 text-pink-700 font-bold text-sm cursor-pointer mt-2"
            >
              <UserIcon className="w-4 h-4 text-pink-500" />
              <span>My Member Profile</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => handleTabClick('owner')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-sm cursor-pointer mt-2"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Owner Control Panel</span>
              </div>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-pink-600 text-xs font-black">
                  {pendingRequestsCount} Pending
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
