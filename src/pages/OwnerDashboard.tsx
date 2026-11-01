import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService, subscribeToRealtimeChanges, DEFAULT_SITE_CONFIG } from '../services/storage';
import {
  RegistrationRequest,
  User,
  ReportItem,
  Confession,
  Announcement,
  DailyTask,
  TruthOrDareItem,
  ThisOrThatItem,
  Quiz,
  SiteConfig,
} from '../types';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  getSupabaseSQLSchema,
} from '../services/supabase';
import {
  Crown,
  Palette,
  FileText,
  Layout,
  Users,
  ShieldCheck,
  Gamepad2,
  CheckSquare,
  Award,
  AlertTriangle,
  Megaphone,
  Database,
  Check,
  X,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
  Save,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigateHome: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateHome }) => {
  const { currentUser, isOwner } = useAuth();
  const { config, updateConfig, resetToDefault } = useTheme();

  const [activeTab, setActiveTab] = useState<
    | 'requests'
    | 'members'
    | 'branding'
    | 'content'
    | 'sections'
    | 'games'
    | 'tasks'
    | 'ranks'
    | 'moderation'
    | 'announcements'
    | 'supabase'
  >('requests');

  // Local editable copies of data
  const [requests, setRequests] = useState<RegistrationRequest[]>(() =>
    StorageService.getRegistrationRequests()
  );
  const [members, setMembers] = useState<User[]>(() =>
    StorageService.getUsers().filter((u) => u.status === 'approved')
  );
  const [reports, setReports] = useState<ReportItem[]>(() => StorageService.getReports());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    StorageService.getAnnouncements()
  );
  const [tasks, setTasks] = useState<DailyTask[]>(() => StorageService.getTasks());
  const [truthOrDareList, setTruthOrDareList] = useState<TruthOrDareItem[]>(() =>
    StorageService.getTruthOrDareItems()
  );
  const [thisOrThatList, setThisOrThatList] = useState<ThisOrThatItem[]>(() =>
    StorageService.getThisOrThatItems()
  );

  // Form State for Branding
  const [siteName, setSiteName] = useState(config.siteName);
  const [tagline, setTagline] = useState(config.tagline);
  const [logoEmoji, setLogoEmoji] = useState(config.logoEmoji);
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor);
  const [accentColor, setAccentColor] = useState(config.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor);
  const [fontFamily, setFontFamily] = useState(config.fontFamily);
  const [announcementBarEnabled, setAnnouncementBarEnabled] = useState(
    config.announcementBanner?.enabled ?? true
  );
  const [announcementBarText, setAnnouncementBarText] = useState(
    config.announcementBanner?.text ?? ''
  );

  // Form State for Content
  const [homeHeroTitle, setHomeHeroTitle] = useState(config.homeHeroTitle);
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState(config.homeHeroSubtitle);
  const [confessionsTitle, setConfessionsTitle] = useState(config.confessionsTitle);
  const [confessionsSubtitle, setConfessionsSubtitle] = useState(config.confessionsSubtitle);
  const [chatTitle, setChatTitle] = useState(config.chatTitle);
  const [chatSubtitle, setChatSubtitle] = useState(config.chatSubtitle);
  const [gamesTitle, setGamesTitle] = useState(config.gamesTitle);
  const [gamesSubtitle, setGamesSubtitle] = useState(config.gamesSubtitle);
  const [tasksTitle, setTasksTitle] = useState(config.tasksTitle);
  const [tasksSubtitle, setTasksSubtitle] = useState(config.tasksSubtitle);
  const [communityRules, setCommunityRules] = useState(config.communityRules.join('\n'));

  // Form State for Navigation Labels
  const [navLabels, setNavLabels] = useState({ ...config.navigationLabels });
  const [enabledSections, setEnabledSections] = useState({ ...config.enabledSections });

  // Announcements form
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnTag, setNewAnnTag] = useState('Official');

  // Supabase connection form
  const storedSupa = getStoredSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(storedSupa.url);
  const [supaKey, setSupaKey] = useState(storedSupa.anonKey);
  const [supaTesting, setSupaTesting] = useState(false);
  const [supaTestResult, setSupaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync real-time updates
  useEffect(() => {
    const unsub = subscribeToRealtimeChanges((type) => {
      if (type === 'REGISTRATION_REQUEST_CREATED' || type === 'REGISTRATION_APPROVED') {
        setRequests(StorageService.getRegistrationRequests());
        setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
      } else if (type === 'USERS_UPDATED') {
        setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
      } else if (type === 'REPORTS_UPDATED') {
        setReports(StorageService.getReports());
      } else if (type === 'ANNOUNCEMENTS_UPDATED') {
        setAnnouncements(StorageService.getAnnouncements());
      }
    });
    return unsub;
  }, []);

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-slate-500">
        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Owner Access Required</h2>
        <p className="text-xs text-slate-400 mt-1">
          This dashboard is reserved exclusively for the Chika Club owner.
        </p>
      </div>
    );
  }

  // --- ACTIONS ---

  // 1. APPROVE / REJECT REGISTRATION
  const handleApprove = (reqId: string) => {
    const res = StorageService.approveRegistration(reqId, currentUser?.id || 'owner');
    if (res.success) {
      setRequests(StorageService.getRegistrationRequests());
      setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
      showToast('✓ Registration approved! User is now an active member.');
    }
  };

  const handleReject = (reqId: string) => {
    const success = StorageService.rejectRegistration(reqId, currentUser?.id || 'owner');
    if (success) {
      setRequests(StorageService.getRegistrationRequests());
      showToast('Registration declined.');
    }
  };

  // 2. SAVE BRANDING
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      siteName,
      tagline,
      logoEmoji,
      primaryColor,
      accentColor,
      backgroundColor,
      fontFamily,
      announcementBanner: {
        enabled: announcementBarEnabled,
        text: announcementBarText,
      },
    });
    showToast('✓ Branding & design updated live across the entire website!');
  };

  // 3. SAVE CONTENT & PAGES
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesArray = communityRules
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    updateConfig({
      homeHeroTitle,
      homeHeroSubtitle,
      confessionsTitle,
      confessionsSubtitle,
      chatTitle,
      chatSubtitle,
      gamesTitle,
      gamesSubtitle,
      tasksTitle,
      tasksSubtitle,
      communityRules: rulesArray,
    });
    showToast('✓ Page titles, text, and community rules saved live!');
  };

  // 4. SAVE SECTIONS & NAVIGATION
  const handleSaveSections = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      navigationLabels: navLabels,
      enabledSections,
    });
    showToast('✓ Navigation menus and section visibility updated!');
  };

  // 5. MEMBER ROLE & XP MANAGEMENT
  const handleUpdateMemberRole = (userId: string, newRole: any) => {
    StorageService.updateUser(userId, { role: newRole });
    setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
    showToast(`✓ Updated role to ${newRole}`);
  };

  const handleAwardBonusXp = (userId: string) => {
    StorageService.awardXp(userId, 100);
    setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
    showToast('✓ Awarded +100 bonus XP!');
  };

  const handleDeleteMember = (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the club?')) {
      StorageService.deleteUser(userId);
      setMembers(StorageService.getUsers().filter((u) => u.status === 'approved'));
      showToast('Member removed.');
    }
  };

  // 6. CREATE ANNOUNCEMENT
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    const ann: Announcement = {
      id: 'ann-' + Date.now(),
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      tag: newAnnTag,
      pinned: true,
      authorName: currentUser?.displayName || 'Club Owner',
      createdAt: new Date().toISOString(),
      reactions: { '💖': 1, '🎉': 1 },
    };

    const currentList = StorageService.getAnnouncements();
    const updated = [ann, ...currentList];
    StorageService.saveAnnouncements(updated);
    setAnnouncements(updated);

    // Push notification to all members
    StorageService.addNotification({
      id: 'notif-ann-' + Date.now(),
      userId: 'all',
      title: '📢 New Announcement from Owner!',
      message: `${ann.title}: ${ann.content.slice(0, 70)}...`,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString(),
    });

    setNewAnnTitle('');
    setNewAnnContent('');
    showToast('✓ Announcement posted and notification sent to all members!');
  };

  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    StorageService.saveAnnouncements(updated);
    setAnnouncements(updated);
    showToast('Announcement removed.');
  };

  // 7. MODERATION RESOLVE
  const handleDismissReport = (id: string) => {
    StorageService.resolveReport(id, 'dismissed');
    setReports(StorageService.getReports());
    showToast('Report marked as dismissed.');
  };

  const handleDeleteReportedContent = (report: ReportItem) => {
    if (report.targetType === 'confession') {
      StorageService.deleteConfession(report.targetId);
    }
    StorageService.resolveReport(report.id, 'resolved');
    setReports(StorageService.getReports());
    showToast('✓ Content removed and report marked as resolved.');
  };

  // 8. SUPABASE ACTIONS
  const handleTestSupabase = async () => {
    setSupaTesting(true);
    setSupaTestResult(null);
    const res = await testSupabaseConnection(supaUrl, supaKey);
    setSupaTestResult(res);
    setSupaTesting(false);
  };

  const handleSaveSupabase = () => {
    saveStoredSupabaseConfig({
      url: supaUrl.trim(),
      anonKey: supaKey.trim(),
      enabled: Boolean(supaUrl.trim() && supaKey.trim()),
    });
    showToast('✓ Supabase connection settings saved!');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSQLSchema());
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-300 mb-2 border border-white/20">
            <Crown className="w-3.5 h-3.5 fill-amber-300" />
            <span>Master Club Administrator</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
            Owner Control Panel 👑
          </h1>
          <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-xl">
            Customize branding, design, titles, navigate sections, review applicant requests, manage
            members, moderate reports, and configure Supabase in real-time.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/30 transition-colors self-start sm:self-auto cursor-pointer"
        >
          View Live Website →
        </button>
      </div>

      {/* Dashboard Sub-Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-3xl border border-pink-100 shadow-xs">
        {[
          { id: 'requests', label: 'Registration Requests', icon: ShieldCheck, badge: pendingRequests.length },
          { id: 'members', label: 'Members & Roles', icon: Users, badge: members.length },
          { id: 'branding', label: 'Design & Branding', icon: Palette },
          { id: 'content', label: 'Pages & Content', icon: FileText },
          { id: 'sections', label: 'Sections & Menus', icon: Layout },
          { id: 'games', label: 'Games & Arcade', icon: Gamepad2 },
          { id: 'tasks', label: 'Tasks & Quests', icon: CheckSquare },
          { id: 'ranks', label: 'Levels & Ranks', icon: Award },
          { id: 'moderation', label: 'Moderation Queue', icon: AlertTriangle, badge: pendingReports.length },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'supabase', label: 'Supabase Database', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-pink-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-purple-700' : 'bg-pink-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. REGISTRATION REQUESTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="flex items-center justify-between border-b border-pink-100 pb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Pending Registration Requests ({pendingRequests.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All worldwide registrations require your approval before gaining access to the lounge.
              </p>
            </div>
            <button
              onClick={() => setRequests(StorageService.getRegistrationRequests())}
              className="p-2 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl">
                ✓
              </div>
              <h3 className="font-bold text-slate-700 text-sm">No Pending Requests</h3>
              <p className="text-xs text-slate-400 mt-1">
                You’ve reviewed all new applications! New requests will notify you instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50/50 to-purple-50/50 border border-pink-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={req.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-2xl bg-white p-0.5 object-cover ring-2 ring-pink-300 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{req.displayName}</h4>
                        <span className="text-xs font-semibold text-pink-600">@{req.username}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{req.email}</div>
                      {req.bio && (
                        <div className="text-xs text-slate-600 italic bg-white/70 px-2.5 py-1 rounded-lg border border-pink-100">
                          "{req.bio}"
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        Submitted{' '}
                        {new Date(req.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        at{' '}
                        {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold shadow-sm shadow-emerald-200 hover:scale-103 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Member</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MEMBERS & ROLES TAB */}
      {/* ======================================================== */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Approved Club Members ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage member roles, permissions, award bonus XP, or remove accounts.
            </p>
          </div>

          <div className="divide-y divide-pink-50">
            {members.map((m) => (
              <div
                key={m.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-2xl bg-pink-100 object-cover ring-1 ring-pink-200"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>{m.displayName}</span>
                      <span className="text-xs text-slate-400 font-normal">@{m.username}</span>
                      {m.role === 'owner' && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-700">
                          Owner 👑
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {m.email} • Level {m.level} ({m.rankTitle}) • {m.xp} XP
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={m.role}
                    onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>

                  <button
                    onClick={() => handleAwardBonusXp(m.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 cursor-pointer"
                  >
                    +100 XP
                  </button>

                  {m.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDeleteMember(m.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESIGN & BRANDING TAB */}
      {/* ======================================================== */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-500" />
              <span>Design & Branding Customizer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Change website name, logo emoji, colors, fonts, and banner text. Changes apply live immediately!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Website Name</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Logo / Mascot Emoji</label>
              <input
                type="text"
                value={logoEmoji}
                onChange={(e) => setLogoEmoji(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 text-sm"
            />
          </div>

          {/* Color Palette Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Background Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Font selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Typography Font</label>
            <div className="flex gap-3">
              {[
                { id: 'quicksand', label: 'Quicksand (Playful & Rounded)' },
                { id: 'jakarta', label: 'Plus Jakarta Sans (Modern & Clean)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontFamily(f.id as any)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    fontFamily === f.id
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top Announcement Bar */}
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Top Header Announcement Ribbon</label>
              <input
                type="checkbox"
                checked={announcementBarEnabled}
                onChange={(e) => setAnnouncementBarEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
              />
            </div>
            {announcementBarEnabled && (
              <input
                type="text"
                placeholder="Text for top banner ribbon..."
                value={announcementBarText}
                onChange={(e) => setAnnouncementBarText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={resetToDefault}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Reset to Factory Colors
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:scale-102 transition-transform cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Live Design</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 4. PAGES & CONTENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveContent} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Page Titles, Descriptions & Content Editor</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit the text of every page without touching any code!
            </p>
          </div>

          {/* Home Section Text */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Home Page Content</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={homeHeroTitle}
                  onChange={(e) => setHomeHeroTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hero Subtitle</label>
                <input
                  type="text"
                  value={homeHeroSubtitle}
                  onChange={(e) => setHomeHeroSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Confessions Section Text */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Confessions Page Content</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Page Title</label>
                <input
                  type="text"
                  value={confessionsTitle}
                  onChange={(e) => setConfessionsTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Page Subtitle</label>
                <input
                  type="text"
                  value={confessionsSubtitle}
                  onChange={(e) => setConfessionsSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Chat Lounge Text */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Chat Lounge Content</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Page Title</label>
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Page Subtitle</label>
                <input
                  type="text"
                  value={chatSubtitle}
                  onChange={(e) => setChatSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Community Rules */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Community Rules & Guidelines (one rule per line)
            </label>
            <textarea
              rows={4}
              value={communityRules}
              onChange={(e) => setCommunityRules(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs outline-none focus:border-pink-500 font-medium"
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:scale-102 transition-transform cursor-pointer"
            >
              Save All Page Content
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 5. SECTIONS & LAYOUT TAB */}
      {/* ======================================================== */}
      {activeTab === 'sections' && (
        <form onSubmit={handleSaveSections} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600" />
              <span>Section Visibility & Navigation Menu Labels</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable or disable sections, and customize the text shown on navigation buttons.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'home', defaultName: 'Home' },
              { id: 'confessions', defaultName: 'Confessions' },
              { id: 'chat', defaultName: 'Chat Room' },
              { id: 'games', defaultName: 'Games' },
              { id: 'tasks', defaultName: 'Daily Quests' },
              { id: 'leaderboard', defaultName: 'Ranks' },
            ].map((sec) => (
              <div
                key={sec.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enabledSections[sec.id as keyof typeof enabledSections] ?? true}
                    onChange={(e) =>
                      setEnabledSections({ ...enabledSections, [sec.id]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-pink-600 cursor-pointer"
                  />
                  <span className="font-bold text-xs uppercase text-slate-700">{sec.id} Section</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Nav Label:</span>
                  <input
                    type="text"
                    value={navLabels[sec.id as keyof typeof navLabels] || sec.defaultName}
                    onChange={(e) =>
                      setNavLabels({ ...navLabels, [sec.id]: e.target.value })
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:scale-102 transition-transform cursor-pointer"
            >
              Save Navigation & Sections
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 6. GAMES & ARCADE TAB */}
      {/* ======================================================== */}
      {activeTab === 'games' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              <span>Community Games Customizer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Truth or Dare questions, This or That options, and arcade content.
            </p>
          </div>

          {/* Truth or Dare List */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Truth or Dare Prompts ({truthOrDareList.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {truthOrDareList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold uppercase text-pink-700 mr-2">[{item.type}]</span>
                    <span className="text-slate-800">{item.question}</span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = truthOrDareList.filter((td) => td.id !== item.id);
                      setTruthOrDareList(updated);
                      StorageService.saveTruthOrDareItems(updated);
                    }}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. TASKS & QUESTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <span>Daily Tasks & XP Rewards Editor</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure daily goals, target counts, and XP payouts for club activities.
            </p>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{task.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800">{task.title}</div>
                    <div className="text-slate-500">{task.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                    +{task.xpReward} XP
                  </span>
                  <span className="text-slate-400 font-semibold">Target: {task.targetCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. LEVELS & RANKS TAB */}
      {/* ======================================================== */}
      {activeTab === 'ranks' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Member Ranks & Level Thresholds</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and adjust the XP requirements for each member tier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.levelThresholds.map((tier) => (
              <div
                key={tier.level}
                className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
                  {tier.badgeEmoji}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    Level {tier.level}: {tier.title}
                  </div>
                  <div className="text-xs text-pink-600 font-bold">
                    Requires {tier.requiredXp} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODERATION QUEUE TAB */}
      {/* ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Community Moderation Queue ({pendingReports.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reports filed by club members regarding confessions or chat messages.
            </p>
          </div>

          {pendingReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-xl">
                ✓
              </div>
              No pending reports! The lounge is clean and harmonious.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <span>Reason: {report.reason}</span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.2 rounded-full uppercase">
                        {report.targetType}
                      </span>
                    </div>
                    <div className="text-slate-600 bg-white/80 p-2 rounded-xl border border-red-100">
                      Snippet: "{report.targetSnippet}"
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reported by @{report.reportedByUsername} on{' '}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white font-bold"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDeleteReportedContent(report)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Content</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. ANNOUNCEMENTS & BROADCAST TAB */}
      {/* ======================================================== */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Post New Announcement</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Publishes to the home bulletin and sends a notification alert to all members.
            </p>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ✨ Weekend Lounge Party & Trivia Contest!"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tag</label>
                <input
                  type="text"
                  value={newAnnTag}
                  onChange={(e) => setNewAnnTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Content</label>
              <textarea
                required
                rows={3}
                placeholder="Write the full announcement..."
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-200 hover:scale-102 transition-transform cursor-pointer"
            >
              Broadcast Announcement 📢
            </button>
          </form>

          {/* Active announcements */}
          <div className="pt-4 border-t border-pink-100 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Active Bulletins ({announcements.length})
            </h3>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{ann.title}</span>
                  <p className="text-slate-500 line-clamp-1">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. SUPABASE CLOUD DATABASE & SQL TAB */}
      {/* ======================================================== */}
      {activeTab === 'supabase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h2 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Supabase Cloud Integration & Database Setup</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your live Supabase project for real-time Postgres tables, storage, and row-level security.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            <strong className="block mb-1 font-bold">💡 How Supabase works in Chika Club:</strong>
            Chika Club is built with a dual-engine architecture: it functions smoothly right now with real-time cross-tab synchronization, and can be connected directly to your cloud Supabase database anytime by pasting your project credentials below.
          </div>

          {/* Connection inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-ref.supabase.co"
                value={supaUrl}
                onChange={(e) => setSupaUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supaKey}
                onChange={(e) => setSupaKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={supaTesting || !supaUrl}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supaTesting ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSupabase}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Supabase Credentials
              </button>
            </div>

            {supaTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  supaTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {supaTestResult.success ? '✓' : '✗'} {supaTestResult.message}
              </div>
            )}
          </div>

          {/* Complete SQL Schema Exporter */}
          <div className="pt-4 border-t border-pink-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Supabase SQL Database Migration Script
                </h3>
                <p className="text-[11px] text-slate-400">
                  Run this complete SQL script in your Supabase SQL Editor to initialize all 12 tables and RLS policies!
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-pink-200 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
              {getSupabaseSQLSchema()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
