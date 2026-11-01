/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { NotificationCenter } from './components/NotificationCenter';
import { SearchModal } from './components/SearchModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ConfessionsPage } from './pages/ConfessionsPage';
import { ChatPage } from './pages/ChatPage';
import { GamesPage } from './pages/GamesPage';
import { TasksPage } from './pages/TasksPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { OwnerDashboard } from './pages/OwnerDashboard';

function MainApp() {
  const { currentUser, pendingRequest, isAuthenticated, isOwner } = useAuth();
  const { config } = useTheme();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenOwnerPasscode = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleSelectSearchResult = (type: string, id: string) => {
    if (type === 'confessions') setCurrentTab('confessions');
    else if (type === 'profile') setCurrentTab('profile');
    else if (type === 'home') setCurrentTab('home');
    else if (type === 'chat') setCurrentTab('chat');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadNotificationsCount={0}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {pendingRequest ? (
          /* User submitted registration and is waiting for Owner Approval */
          <PendingApprovalScreen />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomePage
                onNavigate={setCurrentTab}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentTab === 'confessions' && (
              <ConfessionsPage onOpenAuth={handleOpenAuth} />
            )}

            {currentTab === 'chat' && (
              <ChatPage onOpenAuth={handleOpenAuth} />
            )}

            {currentTab === 'games' && (
              <GamesPage onOpenAuth={handleOpenAuth} />
            )}

            {currentTab === 'tasks' && (
              <TasksPage
                onOpenAuth={handleOpenAuth}
                onNavigate={setCurrentTab}
              />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardPage />
            )}

            {currentTab === 'profile' && (
              <ProfilePage />
            )}

            {currentTab === 'owner' && isOwner && (
              <OwnerDashboard onNavigateHome={() => setCurrentTab('home')} />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigateToTab={setCurrentTab}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Footer */}
      <Footer onOpenOwnerPasscode={handleOpenOwnerPasscode} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
