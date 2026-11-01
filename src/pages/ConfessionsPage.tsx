import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService, subscribeToRealtimeChanges } from '../services/storage';
import { Confession, ConfessionComment, ReportItem } from '../types';
import {
  HeartHandshake,
  Plus,
  MessageSquare,
  Flag,
  Sparkles,
  Send,
  X,
  CornerDownRight,
  ShieldAlert,
  Flame,
  Check,
  Filter,
} from 'lucide-react';

interface ConfessionsPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const CATEGORY_TAGS = [
  '#All',
  '#Crush',
  '#LifeSecrets',
  '#SchoolCampus',
  '#FunnyMoments',
  '#LateNightThoughts',
  '#FriendshipDrama',
  '#DeepVent',
];

const THEME_OPTIONS = [
  { id: 'pink', name: 'Pastel Rose', bgClass: 'bg-gradient-to-br from-pink-50 to-pink-100/70 border-pink-200' },
  { id: 'purple', name: 'Lavender Cloud', bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100/70 border-purple-200' },
  { id: 'peach', name: 'Peachy Glow', bgClass: 'bg-gradient-to-br from-orange-50 to-amber-100/70 border-orange-200' },
  { id: 'mint', name: 'Soft Mint', bgClass: 'bg-gradient-to-br from-emerald-50 to-teal-100/70 border-emerald-200' },
  { id: 'blue', name: 'Dreamy Blue', bgClass: 'bg-gradient-to-br from-sky-50 to-indigo-100/70 border-sky-200' },
];

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '🥺'];

export const ConfessionsPage: React.FC<ConfessionsPageProps> = ({ onOpenAuth }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { config } = useTheme();

  const [confessions, setConfessions] = useState<Confession[]>(() => StorageService.getConfessions());
  const [activeTag, setActiveTag] = useState('#All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'discussed'>('newest');

  // Create Confession Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedTag, setSelectedTag] = useState('#Crush');
  const [selectedTheme, setSelectedTheme] = useState('pink');

  // Comments View State: Map confessionId -> boolean
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, ConfessionComment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [replyInputOpen, setReplyInputOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Report Modal State
  const [reportingConfession, setReportingConfession] = useState<Confession | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or offensive content');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Sync realtime
  useEffect(() => {
    const unsub = subscribeToRealtimeChanges((type) => {
      if (type === 'CONFESSION_ADDED' || type === 'CONFESSION_DELETED' || type === 'CONFESSION_REACTION_UPDATED') {
        setConfessions(StorageService.getConfessions());
      } else if (type === 'COMMENT_ADDED' || type === 'REPLY_ADDED') {
        // Refresh open comments
        setConfessions(StorageService.getConfessions());
      }
    });
    return unsub;
  }, []);

  const handleCreateConfession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const newConfession: Confession = {
      id: 'conf-' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isAnonymous,
      content: content.trim(),
      tag: selectedTag,
      colorTheme: selectedTheme,
      createdAt: new Date().toISOString(),
      reactions: {},
      userReactions: {},
      commentsCount: 0,
    };

    StorageService.addConfession(newConfession);
    setConfessions(StorageService.getConfessions());
    setContent('');
    setIsCreateOpen(false);
  };

  const handleToggleReaction = (confessionId: string, emoji: string) => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }
    const updated = StorageService.toggleReaction(confessionId, currentUser.id, emoji);
    if (updated) {
      setConfessions(StorageService.getConfessions());
    }
  };

  const toggleCommentsView = (confessionId: string) => {
    const nextState = !openComments[confessionId];
    setOpenComments({ ...openComments, [confessionId]: nextState });
    if (nextState) {
      setCommentsMap((prev) => ({
        ...prev,
        [confessionId]: StorageService.getComments(confessionId),
      }));
    }
  };

  const handleAddComment = (confessionId: string) => {
    const text = newCommentText[confessionId]?.trim();
    if (!text) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const comment: ConfessionComment = {
      id: 'comm-' + Date.now(),
      confessionId,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isOwner: currentUser.role === 'owner',
      content: text,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    StorageService.addComment(comment);
    setNewCommentText({ ...newCommentText, [confessionId]: '' });
    setCommentsMap((prev) => ({
      ...prev,
      [confessionId]: StorageService.getComments(confessionId),
    }));
    setConfessions(StorageService.getConfessions());
  };

  const handleAddReply = (commentId: string, confessionId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const reply = {
      id: 'rep-' + Date.now(),
      commentId,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      isOwner: currentUser.role === 'owner',
      content: text,
      createdAt: new Date().toISOString(),
    };

    StorageService.addReply(commentId, reply);
    setReplyText({ ...replyText, [commentId]: '' });
    setReplyInputOpen({ ...replyInputOpen, [commentId]: false });
    setCommentsMap((prev) => ({
      ...prev,
      [confessionId]: StorageService.getComments(confessionId),
    }));
    setConfessions(StorageService.getConfessions());
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingConfession || !currentUser) return;

    const report: ReportItem = {
      id: 'rep-' + Date.now(),
      targetType: 'confession',
      targetId: reportingConfession.id,
      targetSnippet: reportingConfession.content.slice(0, 80),
      reportedByUserId: currentUser.id,
      reportedByUsername: currentUser.username,
      reason: reportReason,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    StorageService.addReport(report);
    setReportSuccess(true);
    setTimeout(() => {
      setReportingConfession(null);
      setReportSuccess(false);
    }, 1500);
  };

  // Filter & Sort
  const filteredConfessions = confessions.filter((c) => {
    if (activeTag === '#All') return true;
    return c.tag === activeTag;
  });

  const sortedConfessions = [...filteredConfessions].sort((a, b) => {
    if (sortBy === 'popular') {
      const sumReactions = (rec: Record<string, number> = {}) => Object.values(rec).reduce((s, n) => s + n, 0);
      return sumReactions(b.reactions) - sumReactions(a.reactions);
    }
    if (sortBy === 'discussed') {
      return (b.commentsCount || 0) - (a.commentsCount || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
            <span>Safe & Confidential</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">
            {config.confessionsTitle || 'Secret Confessions 💌'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {config.confessionsSubtitle ||
              'Spill your deepest thoughts, crush secrets, or campus vents. Share anonymously or proudly with your handle!'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              onOpenAuth('login');
            } else {
              setIsCreateOpen(true);
            }
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Spill a Confession</span>
        </button>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTag === tag
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-pink-50 border border-slate-200/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-pink-400"
          >
            <option value="newest">Latest First</option>
            <option value="popular">Most Reacted</option>
            <option value="discussed">Most Discussed</option>
          </select>
        </div>
      </div>

      {/* Confessions Stream */}
      <div className="space-y-4">
        {sortedConfessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 text-3xl flex items-center justify-center mx-auto mb-3">
              💌
            </div>
            <h3 className="font-display font-bold text-slate-800 text-base">No confessions here yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Be the very first member to share a secret confession in this tag!
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) onOpenAuth('login');
                else setIsCreateOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition-colors"
            >
              Post the First Confession ✨
            </button>
          </div>
        ) : (
          sortedConfessions.map((confession) => {
            const themeConfig =
              THEME_OPTIONS.find((t) => t.id === confession.colorTheme) || THEME_OPTIONS[0];
            const isCommentsShowing = openComments[confession.id];
            const commentsList = commentsMap[confession.id] || [];

            return (
              <div
                key={confession.id}
                className={`rounded-3xl p-6 border shadow-xs transition-all ${themeConfig.bgClass}`}
              >
                {/* Author & Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {confession.isAnonymous ? (
                      <div className="w-9 h-9 rounded-2xl bg-white/90 text-pink-500 flex items-center justify-center font-bold text-lg shadow-xs ring-1 ring-pink-200">
                        🤫
                      </div>
                    ) : (
                      <img
                        src={confession.avatarUrl}
                        alt=""
                        className="w-9 h-9 rounded-2xl bg-white object-cover ring-1 ring-pink-200 shadow-xs"
                      />
                    )}

                    <div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{confession.isAnonymous ? 'Secret Bestie' : confession.displayName}</span>
                        {confession.isAnonymous && (
                          <span className="text-[10px] text-pink-600 font-semibold bg-white/80 px-1.5 py-0.2 rounded-full">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(confession.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(confession.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 text-pink-700 shadow-2xs border border-pink-100">
                      {confession.tag}
                    </span>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) onOpenAuth('login');
                        else setReportingConfession(confession);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/60 transition-colors cursor-pointer"
                      title="Report Confession"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confession Text */}
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium mb-5">
                  {confession.content}
                </p>

                {/* Action Bar: Reactions & Comments */}
                <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
                  {/* Reactions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {REACTION_EMOJIS.map((emoji) => {
                      const count = confession.reactions?.[emoji] || 0;
                      const hasReacted =
                        currentUser && confession.userReactions?.[currentUser.id] === emoji;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(confession.id, emoji)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            hasReacted
                              ? 'bg-pink-500 text-white shadow-xs scale-105'
                              : 'bg-white/80 hover:bg-white text-slate-700 hover:scale-105'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-[11px]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Comment toggle button */}
                  <button
                    onClick={() => toggleCommentsView(confession.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                    <span>{confession.commentsCount || 0} Comments</span>
                  </button>
                </div>

                {/* Comments Section (Collapsible) */}
                {isCommentsShowing && (
                  <div className="mt-4 pt-4 border-t border-black/5 space-y-3 animate-fadeIn">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={
                          isAuthenticated
                            ? 'Write a supportive comment or reaction...'
                            : 'Log in to comment...'
                        }
                        value={newCommentText[confession.id] || ''}
                        onChange={(e) =>
                          setNewCommentText({ ...newCommentText, [confession.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(confession.id);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                      />
                      <button
                        onClick={() => handleAddComment(confession.id)}
                        className="px-3.5 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2.5 pt-2">
                      {commentsList.length === 0 ? (
                        <p className="text-center py-3 text-xs text-slate-400">
                          No comments yet. Be the first to reply!
                        </p>
                      ) : (
                        commentsList.map((comm) => (
                          <div key={comm.id} className="p-3 rounded-2xl bg-white/90 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={comm.avatarUrl}
                                  alt=""
                                  className="w-6 h-6 rounded-full bg-pink-50 object-cover"
                                />
                                <span className="text-xs font-bold text-slate-800">
                                  {comm.displayName}
                                </span>
                                {comm.isOwner && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.2 rounded-full">
                                    Owner 👑
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comm.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 pl-8 leading-relaxed">{comm.content}</p>

                            {/* Reply Action */}
                            <div className="pl-8 flex items-center gap-3 text-[11px] text-pink-600 font-bold">
                              <button
                                onClick={() =>
                                  setReplyInputOpen({
                                    ...replyInputOpen,
                                    [comm.id]: !replyInputOpen[comm.id],
                                  })
                                }
                                className="hover:underline cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>

                            {/* Nested Replies */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="pl-8 pt-1 space-y-1.5">
                                {comm.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className="p-2 rounded-xl bg-pink-50/60 border border-pink-100 text-xs flex items-start gap-2"
                                  >
                                    <CornerDownRight className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                                    <div>
                                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                        <span>{rep.displayName}</span>
                                        {rep.isOwner && (
                                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded-full">
                                            Owner 👑
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-slate-600 mt-0.5">{rep.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Box */}
                            {replyInputOpen[comm.id] && (
                              <div className="pl-8 pt-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Reply to ${comm.displayName}...`}
                                  value={replyText[comm.id] || ''}
                                  onChange={(e) =>
                                    setReplyText({ ...replyText, [comm.id]: e.target.value })
                                  }
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400"
                                />
                                <button
                                  onClick={() => handleAddReply(comm.id, confession.id)}
                                  className="px-3 py-1.5 rounded-lg bg-pink-500 text-white text-xs font-bold"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE CONFESSION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-pink-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-display font-extrabold text-lg">Spill a Secret Confession</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConfession} className="p-6 space-y-4">
              {/* Anonymous vs Public Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isAnonymous ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🤫 Post Anonymously</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isAnonymous ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>✨ Post as @{currentUser?.username || 'You'}</span>
                </button>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TAGS.filter((t) => t !== '#All').map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-pink-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-pink-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Color Theme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Card Theme</label>
                <div className="flex items-center gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedTheme === theme.id
                          ? 'border-pink-500 bg-pink-100 text-pink-700 font-black ring-2 ring-pink-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Confession <span className="text-slate-400 font-normal">({content.length}/500)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="Spill what’s on your mind... (keep it fun, safe, and respectful!)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!content.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 transition-all cursor-pointer disabled:opacity-50"
              >
                Publish Confession (+25 XP) ✨
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPORT CONFESSION MODAL */}
      {reportingConfession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Report Confession to Owner</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Our community is strictly moderated by the club owner. Reports are reviewed immediately.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                ✓ Report submitted to Owner Control Panel. Thank you for keeping Chika Club safe!
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                    <option value="Bullying, harassment, or hate speech">Bullying, harassment, or hate speech</option>
                    <option value="Doxxing or sharing private names/info">Doxxing or sharing private names/info</option>
                    <option value="Spam or promotional advertising">Spam or promotional advertising</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingConfession(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
