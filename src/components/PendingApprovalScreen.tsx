import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Clock, ShieldAlert, Sparkles, RefreshCw, LogOut, CheckCircle2, Crown } from 'lucide-react';
import { StorageService } from '../services/storage';

export const PendingApprovalScreen: React.FC = () => {
  const { pendingRequest, logout, claimOwnerAccess } = useAuth();
  const { config } = useTheme();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showOwnerQuickAuth, setShowOwnerQuickAuth] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleCheckStatus = () => {
    setChecking(true);
    setMessage(null);
    setTimeout(() => {
      if (pendingRequest) {
        const req = StorageService.getRegistrationRequests().find((r) => r.id === pendingRequest.id);
        if (req?.status === 'approved') {
          setMessage('🎉 You have been approved! Loading your lounge...');
          window.location.reload();
        } else if (req?.status === 'rejected') {
          setMessage('Your registration was not approved by the owner.');
        } else {
          setMessage('Still pending owner review. The owner has received a notification!');
        }
      }
      setChecking(false);
    }, 600);
  };

  const handleSimulateOwnerApproval = () => {
    if (pendingRequest) {
      StorageService.approveRegistration(pendingRequest.id, 'owner');
      setMessage('🎉 Approved! Welcome to Chika Club!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-xl border border-pink-100 text-center relative overflow-hidden">
        {/* Cute background decoration */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Badge Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-pink-400 to-purple-400 p-1 shadow-lg shadow-pink-200 mb-5 relative animate-pulse-subtle">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <Clock className="w-10 h-10 text-pink-500" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-2xl">💌</span>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-slate-800 mb-2">
          Application Pending Approval
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Welcome, <span className="font-bold text-pink-600">{pendingRequest?.displayName || 'Bestie'}</span>! To
          ensure a friendly, real, and troll-free sanctuary, all new registrations must be approved by the club owner.
        </p>

        {/* Status Card */}
        <div className="bg-pink-50/70 rounded-2xl p-4 text-left border border-pink-100 mb-6">
          <div className="flex items-center gap-3">
            <img
              src={pendingRequest?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=new'}
              alt="Avatar"
              className="w-12 h-12 rounded-2xl bg-white p-1 ring-1 ring-pink-200 shadow-xs object-cover"
            />
            <div className="flex-1">
              <div className="font-bold text-slate-800 text-sm">{pendingRequest?.displayName}</div>
              <div className="text-xs text-slate-500">@{pendingRequest?.username} • {pendingRequest?.email}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>Waiting for Owner Review</span>
              </div>
            </div>
          </div>
          {pendingRequest?.bio && (
            <div className="mt-3 text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-xl border border-pink-100">
              "{pendingRequest.bio}"
            </div>
          )}
        </div>

        {message && (
          <div className="p-3 mb-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Approval Status</span>
          </button>

          <button
            onClick={logout}
            className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Log Out</span>
          </button>
        </div>

        {/* Owner Quick Test Helper (allows reviewing and testing the flow easily) */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400">
          <p className="mb-2">Are you testing as the owner or want to quick-approve?</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleSimulateOwnerApproval}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 text-[11px] cursor-pointer"
            >
              Simulate Owner Approve
            </button>
            <button
              onClick={() => setShowOwnerQuickAuth(!showOwnerQuickAuth)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold border border-purple-200 text-[11px] cursor-pointer"
            >
              Log in as Owner 👑
            </button>
          </div>

          {showOwnerQuickAuth && (
            <div className="mt-3 p-3 bg-purple-50/70 rounded-xl text-left">
              <input
                type="password"
                placeholder="Owner Passcode (chika2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 mb-2 bg-white"
              />
              <button
                onClick={() => {
                  const ok = claimOwnerAccess(passcode);
                  if (ok) window.location.reload();
                }}
                className="w-full py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
              >
                Access Owner Control Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
