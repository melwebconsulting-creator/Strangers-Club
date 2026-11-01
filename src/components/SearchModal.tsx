import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { X, Search, HeartHandshake, User, Megaphone, MessageCircle } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: string, id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confessions' | 'members' | 'announcements' | 'chat'>('all');

  if (!isOpen) return null;

  const confessions = StorageService.getConfessions();
  const members = StorageService.getUsers().filter((u) => u.status === 'approved');
  const announcements = StorageService.getAnnouncements();
  const chatMessages = StorageService.getMessages('ch-general');

  const q = query.trim().toLowerCase();

  const filteredConfessions = q
    ? confessions.filter((c) => c.content.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q))
    : [];

  const filteredMembers = q
    ? members.filter((m) => m.displayName.toLowerCase().includes(q) || m.username.toLowerCase().includes(q) || m.bio.toLowerCase().includes(q))
    : [];

  const filteredAnnouncements = q
    ? announcements.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
    : [];

  const filteredMessages = q
    ? chatMessages.filter((m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-pink-100 overflow-hidden mt-10 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-pink-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-pink-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search confessions, members, announcements, or chat..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm outline-none placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-50/50 border-b border-pink-100/60 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('confessions')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'confessions' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Confessions ({filteredConfessions.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('members')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'members' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Members ({filteredMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('announcements')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'announcements' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements ({filteredAnnouncements.length})</span>
          </button>
        </div>

        {/* Results */}
        <div className="p-4 overflow-y-auto space-y-4">
          {!q ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🔍</span>
              Type a keyword to search throughout Chika Club
            </div>
          ) : (
            <>
              {/* Confessions */}
              {(activeFilter === 'all' || activeFilter === 'confessions') && filteredConfessions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-pink-500" /> Confessions
                  </h4>
                  <div className="space-y-2">
                    {filteredConfessions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectResult?.('confessions', c.id);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-pink-50/40 hover:bg-pink-50 border border-pink-100 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                            {c.tag}
                          </span>
                          <span className="text-xs text-slate-500">
                            by {c.isAnonymous ? 'Secret Bestie 🤫' : c.displayName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {(activeFilter === 'all' || activeFilter === 'members') && filteredMembers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-500" /> Members
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onSelectResult?.('profile', m.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-2xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100 flex items-center gap-2.5 cursor-pointer"
                      >
                        <img src={m.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-white p-0.5 ring-1 ring-purple-200" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{m.displayName}</div>
                          <div className="text-[10px] text-purple-600 font-semibold truncate">@{m.username} • Lv. {m.level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements */}
              {(activeFilter === 'all' || activeFilter === 'announcements') && filteredAnnouncements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Announcements
                  </h4>
                  <div className="space-y-2">
                    {filteredAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          onSelectResult?.('home', a.id);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-amber-50/40 hover:bg-amber-50 border border-amber-100 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-800">{a.title}</div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{a.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {filteredConfessions.length === 0 &&
                filteredMembers.length === 0 &&
                filteredAnnouncements.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No results found matching "{query}". Try a different keyword!
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
