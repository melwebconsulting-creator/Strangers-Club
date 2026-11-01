import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { X, Sparkles, ShieldCheck, Heart, Crown, Check, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Mimi&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kiki&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Coco&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lulu&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Neko&backgroundColor=ffdfba',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Boba&backgroundColor=ffd5dc',
];

const INTEREST_TAGS = [
  'Secret Tea 🍵',
  'Campus Gossip 🎓',
  'Late Night Talks 🌙',
  'Crushes & Dating 💌',
  'Gaming 🎮',
  'K-Drama & Movies 🍿',
  'Deep Venting 💭',
  'Memes & Fun 😂',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, claimOwnerAccess } = useAuth();
  const { config } = useTheme();

  const [mode, setMode] = useState<'login' | 'register' | 'owner_passcode'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Secret Tea 🍵', 'Late Night Talks 🌙']);
  const [ownerPasscode, setOwnerPasscode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login encountered an error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !username || !displayName) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        email,
        username,
        displayName,
        avatarUrl,
        bio,
        interests: selectedInterests,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = claimOwnerAccess(ownerPasscode);
    if (ok) {
      onClose();
    } else {
      setError('Invalid Owner Passcode. Please enter the correct owner key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-pink-100 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 p-5 text-white relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{config.logoEmoji || '🌸'}</span>
            <h2 className="font-display font-extrabold text-xl text-white">
              {mode === 'login' ? 'Welcome Back!' : mode === 'register' ? 'Join the Chika Club' : 'Owner Verification'}
            </h2>
          </div>
          <p className="text-xs text-pink-100 font-medium">
            {mode === 'login'
              ? 'Log in to access your confessions, chat lounge, and rank.'
              : mode === 'register'
              ? 'Submit your application. All members require owner approval!'
              : 'Enter Owner Passcode to unlock instant owner controls.'}
          </p>

          {/* Mode Switch Tabs */}
          {mode !== 'owner_passcode' && (
            <div className="flex bg-white/20 p-1 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-pink-600 shadow-xs' : 'text-white hover:bg-white/10'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-pink-600 shadow-xs' : 'text-white hover:bg-white/10'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="bestie@chikaclub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Log In to Lounge'}
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Club Owner?</span>
                <button
                  type="button"
                  onClick={() => setMode('owner_passcode')}
                  className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Owner Passcode Access</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Approval Notice */}
              <div className="p-3 rounded-2xl bg-pink-50/80 border border-pink-200/80 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                <div className="text-xs text-pink-900 leading-relaxed">
                  <span className="font-bold">Owner Approval Required:</span> To guarantee a real, safe, and troll-free
                  sanctuary, the owner reviews every application before granting access.
                </div>
              </div>

              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mia Sparkle ✨"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username (@handle)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. miasparkle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="mia@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pick Your Cute Avatar</label>
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
                      <img src={url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
                <input
                  type="text"
                  placeholder="Tell the club a little about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Interests Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Interests & Vibe</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_TAGS.map((tag) => {
                    const selected = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-pink-100/60'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application for Owner Approval 💌'}
              </button>
            </form>
          )}

          {mode === 'owner_passcode' && (
            <form onSubmit={handleOwnerPasscode} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                Enter the secret Owner Passcode (Default: <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200">chika2026</code>)
                or log in with the registered owner email.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Owner Passcode</label>
                <input
                  type="password"
                  placeholder="Enter passcode..."
                  value={ownerPasscode}
                  onChange={(e) => setOwnerPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-md shadow-purple-200 hover:opacity-95 transition-all cursor-pointer"
              >
                Verify Owner Access 👑
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1"
              >
                Back to Standard Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
