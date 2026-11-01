import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Heart, Sparkles, Crown, X, Globe2 } from 'lucide-react';

interface FooterProps {
  onOpenOwnerPasscode: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenOwnerPasscode }) => {
  const { config } = useTheme();
  const { isOwner } = useAuth();

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <footer className="mt-16 border-t border-pink-100 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-xl shadow-xs">
              {config.logoEmoji || '🌸'}
            </div>
            <div>
              <div className="font-display font-extrabold text-base text-slate-800">
                {config.siteName}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {config.tagline}
              </p>
            </div>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600">
            <button
              onClick={() => setShowRulesModal(true)}
              className="hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
              <span>Community Rules</span>
            </button>

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-pink-600 transition-colors cursor-pointer"
            >
              <span>Privacy & Safe Space</span>
            </button>

            {!isOwner && (
              <button
                onClick={onOpenOwnerPasscode}
                className="hover:text-purple-600 transition-colors cursor-pointer flex items-center gap-1 text-slate-400 hover:text-slate-600"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Owner Portal</span>
              </button>
            )}

            <div className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <Globe2 className="w-3 h-3" />
              <span>Worldwide Access</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-pink-50 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-2">
          <p>© {new Date().getFullYear()} {config.siteName}. All human verified community.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400" /> for genuine besties everywhere
          </p>
        </div>
      </div>

      {/* Community Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-pink-600" />
                <h3 className="font-display font-extrabold text-base text-slate-800">
                  Chika Club Community Rules
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 mb-6">
              {config.communityRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs"
            >
              I Understand & Agree 💕
            </button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-extrabold text-base text-slate-800">
                Privacy & Safe Space Policy
              </h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 mb-6 leading-relaxed">
              <p>
                • <strong>Real Members Only:</strong> Every registration is reviewed and approved by the owner. No bots or fake accounts exist.
              </p>
              <p>
                • <strong>Anonymous Confessions:</strong> When posting anonymously, your author details are completely hidden from the feed.
              </p>
              <p>
                • <strong>Direct Messages:</strong> 1-on-1 conversations are strictly between you and your chat partner.
              </p>
              <p>
                • <strong>Reporting:</strong> Any inappropriate behavior can be flagged directly to the owner.
              </p>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
