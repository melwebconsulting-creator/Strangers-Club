import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { Announcement, DailyQuestion } from '../types';
import {
  Sparkles,
  HeartHandshake,
  MessageCircle,
  Gamepad2,
  CheckSquare,
  Trophy,
  Megaphone,
  HelpCircle,
  Send,
  Heart,
  ChevronRight,
  ShieldCheck,
  Flame,
  Users,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, isAuthenticated, isOwner } = useAuth();
  const { config } = useTheme();

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => StorageService.getAnnouncements());
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion>(() => StorageService.getDailyQuestion());
  const [answerInput, setAnswerInput] = useState('');
  const [answering, setAnswering] = useState(false);

  const confessions = StorageService.getConfessions();
  const approvedMembers = StorageService.getUsers().filter((u) => u.status === 'approved');

  const handleAnswerQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    setAnswering(true);
    const updated = StorageService.answerDailyQuestion(
      currentUser.id,
      currentUser.displayName,
      currentUser.avatarUrl,
      answerInput.trim()
    );
    setDailyQuestion(updated);
    setAnswerInput('');
    setAnswering(false);
  };

  const handleAnnounceReaction = (annId: string, emoji: string) => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }
    const list = StorageService.getAnnouncements();
    const item = list.find((a) => a.id === annId);
    if (item) {
      if (!item.reactions) item.reactions = {};
      item.reactions[emoji] = (item.reactions[emoji] || 0) + 1;
      StorageService.saveAnnouncements(list);
      setAnnouncements([...list]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 p-8 sm:p-12 text-white overflow-hidden shadow-xl shadow-pink-200">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-yellow-200/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-4 border border-white/30">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Welcome to the Official Lounge</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
            {config.homeHeroTitle || 'Where Real Besties Gather 💕'}
          </h1>

          <p className="text-pink-100 text-sm sm:text-base font-medium mb-8 leading-relaxed max-w-xl">
            {config.homeHeroSubtitle ||
              'Spill secret confessions, chat in real-time, play truth or dare, and climb the ranks! Every member is verified.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate('confessions')}
                  className="px-6 py-3 rounded-2xl bg-white text-pink-600 font-bold text-sm shadow-md hover:bg-pink-50 hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Spill a Confession</span>
                </button>
                <button
                  onClick={() => onNavigate('chat')}
                  className="px-6 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm border border-white/30 hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enter Chat Room</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-6 py-3 rounded-2xl bg-white text-pink-600 font-bold text-sm shadow-md hover:bg-pink-50 hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Register to Join</span>
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-6 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm border border-white/30 hover:scale-102 transition-all cursor-pointer"
                >
                  <span>Already Registered? Log In</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Stat Badges */}
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div>
            <div className="text-2xl font-black text-white">{approvedMembers.length}</div>
            <div className="text-xs text-pink-100 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Users className="w-3.5 h-3.5" /> Approved Besties
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{confessions.length}</div>
            <div className="text-xs text-pink-100 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <HeartHandshake className="w-3.5 h-3.5" /> Secret Confessions
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-xs text-pink-100 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Human Verified
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">5 Active</div>
            <div className="text-xs text-pink-100 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Flame className="w-3.5 h-3.5" /> Chat Channels
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stream & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Announcements & Daily Question */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-slate-800">
                  Announcements & Bulletins
                </h2>
              </div>
              <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                Official Updates
              </span>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 border border-pink-100 relative group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-800">
                        {ann.tag}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">by {ann.authorName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mb-2">{ann.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>

                  {/* Reaction Buttons */}
                  <div className="mt-4 pt-3 border-t border-pink-100/60 flex items-center gap-2">
                    {['💖', '🎉', '🔥', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAnnounceReaction(ann.id, emoji)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-pink-200/80 text-xs font-bold text-slate-700 hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{emoji}</span>
                        <span className="text-pink-600 text-[11px]">{ann.reactions?.[emoji] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question of the Day Interactive Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-800">
                    Question of the Day
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Earn +20 XP for answering!</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                Daily Tea 🍵
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 mb-4">
              <p className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">
                "{dailyQuestion.question}"
              </p>
            </div>

            {/* Answer Form */}
            <form onSubmit={handleAnswerQuestion} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder={
                  isAuthenticated
                    ? 'Write your answer to today’s question...'
                    : 'Log in to answer and earn XP...'
                }
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-xs sm:text-sm font-medium"
              />
              <button
                type="submit"
                disabled={answering || !answerInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-purple-200 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Answer</span>
              </button>
            </form>

            {/* Answers Feed */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {dailyQuestion.answers?.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No answers yet! Be the very first bestie to share your thoughts.
                </div>
              ) : (
                dailyQuestion.answers?.map((ans) => (
                  <div
                    key={ans.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                  >
                    <img
                      src={ans.avatarUrl}
                      alt={ans.displayName}
                      className="w-8 h-8 rounded-full bg-purple-100 ring-1 ring-purple-200 shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{ans.displayName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ans.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ans.answer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Action Cards & Community Rules */}
        <div className="space-y-6">
          {/* Feature Quick Launch Cards */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100/80 space-y-3">
            <h3 className="font-display font-extrabold text-base text-slate-800 mb-2">
              Explore Chika Club
            </h3>

            {/* Card 1: Confessions */}
            <div
              onClick={() => onNavigate('confessions')}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-pink-100/50 hover:from-pink-100 hover:to-pink-200/50 border border-pink-200/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-pink-500 shadow-xs group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Secret Confessions</h4>
                  <p className="text-[11px] text-slate-500">Post anonymously or with your handle</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Card 2: Chat */}
            <div
              onClick={() => onNavigate('chat')}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-purple-500 shadow-xs group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Real-time Chat Lounge</h4>
                  <p className="text-[11px] text-slate-500">5 channels + 1-on-1 direct messages</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Card 3: Games */}
            <div
              onClick={() => onNavigate('games')}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 border border-amber-200/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-amber-500 shadow-xs group-hover:scale-110 transition-transform">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Chika Arcade</h4>
                  <p className="text-[11px] text-slate-500">Truth/Dare, This or That, & Quizzes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Card 4: Tasks */}
            <div
              onClick={() => onNavigate('tasks')}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-emerald-500 shadow-xs group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Daily Quests & XP</h4>
                  <p className="text-[11px] text-slate-500">Level up and earn badges</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Community Rules Guidelines */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100/80">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-pink-600" />
              <h3 className="font-display font-extrabold text-base text-slate-800">
                Community Guidelines
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {config.communityRules.slice(0, 4).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">♥</span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
