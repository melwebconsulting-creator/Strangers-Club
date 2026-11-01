import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import {
  User as UserIcon,
  Crown,
  Award,
  Sparkles,
  Flame,
  MessageCircle,
  HeartHandshake,
  Edit3,
  Check,
  X,
  LogOut,
  Calendar,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Mimi&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kiki&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Coco&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lulu&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Neko&backgroundColor=ffdfba',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Boba&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sunny&backgroundColor=ffeaa7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Ruby&backgroundColor=fab1a0',
];

const ALL_INTEREST_TAGS = [
  'Secret Tea 🍵',
  'Campus Gossip 🎓',
  'Late Night Talks 🌙',
  'Crushes & Dating 💌',
  'Gaming 🎮',
  'K-Drama & Movies 🍿',
  'Deep Venting 💭',
  'Memes & Fun 😂',
  'Music & Playlists 🎵',
  'Matcha Lovers 🍵',
];

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { config } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || PRESET_AVATARS[0]);
  const [interests, setInterests] = useState<string[]>(currentUser?.interests || []);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-slate-500">
        Please log in to view your profile.
      </div>
    );
  }

  const confessions = StorageService.getConfessions().filter((c) => c.userId === currentUser.id);

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatarUrl,
      interests,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const badges = [
    { name: 'Welcome Bestie', desc: 'Approved member of Chika Club', icon: '🌸', unlocked: true },
    {
      name: 'Tea Spiller',
      desc: 'Shared at least 1 secret confession',
      icon: '🍵',
      unlocked: confessions.length > 0,
    },
    {
      name: 'Streak Master',
      desc: 'Kept active daily for 3+ days',
      icon: '🔥',
      unlocked: (currentUser.streakDays || 1) >= 3,
    },
    {
      name: 'VIP Socialite',
      desc: 'Earned 300+ XP in the lounge',
      icon: '👑',
      unlocked: (currentUser.xp || 0) >= 300,
    },
    {
      name: 'Club Founder',
      desc: 'Official club owner or creator',
      icon: '⭐',
      unlocked: currentUser.role === 'owner',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 relative overflow-hidden">
        {/* Cute background wash */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-pink-100/60 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Cute Frame */}
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-pink-100 object-cover ring-4 ring-pink-300 shadow-md"
            />
            {currentUser.role === 'owner' && (
              <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md">
                <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-display font-extrabold text-2xl text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                  <span>{currentUser.displayName}</span>
                  {currentUser.role === 'owner' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold">
                      Owner 👑
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  @{currentUser.username} • Joined{' '}
                  {new Date(currentUser.joinedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Edit button */}
              <button
                onClick={() => {
                  setDisplayName(currentUser.displayName);
                  setBio(currentUser.bio);
                  setAvatarUrl(currentUser.avatarUrl);
                  setInterests(currentUser.interests);
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-center sm:self-start"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {currentUser.bio || 'Living life one chika at a time! 💕'}
            </p>

            {/* Interests Pills */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
              {currentUser.interests?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 text-[11px] font-semibold border border-pink-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
            ✓ Profile successfully updated!
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 text-center">
          <div className="text-2xl font-black text-pink-600">{currentUser.xp}</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">Total XP</div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 text-center">
          <div className="text-2xl font-black text-purple-600">Level {currentUser.level}</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">{currentUser.rankTitle}</div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 text-center">
          <div className="text-2xl font-black text-rose-600">{confessions.length}</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">Confessions Shared</div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 text-center">
          <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 fill-amber-500" />
            <span>{currentUser.streakDays || 1}</span>
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">Day Streak</div>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="font-display font-extrabold text-base text-slate-800">
            Badges & Achievements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                b.unlocked
                  ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200'
                  : 'bg-slate-50/70 border-slate-200 opacity-50 grayscale'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-xl shrink-0">
                {b.icon}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1">
                  <span>{b.name}</span>
                  {b.unlocked && <Check className="w-3 h-3 text-emerald-600" />}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings / Logout */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Account Session</h3>
          <p className="text-xs text-slate-400">Signed in as {currentUser.email}</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base">Edit Member Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pick New Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-11 h-11 rounded-2xl p-0.5 border-2 transition-transform cursor-pointer shrink-0 ${
                        avatarUrl === url
                          ? 'border-pink-500 scale-105 shadow-md shadow-pink-200 bg-pink-50'
                          : 'border-transparent hover:border-pink-200'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full rounded-xl object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_INTEREST_TAGS.map((tag) => {
                    const selected = interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
