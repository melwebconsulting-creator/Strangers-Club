import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { Trophy, Crown, Flame, HeartHandshake, Sparkles, Medal } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { config } = useTheme();

  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'xp' | 'confessions' | 'streaks'>('xp');

  const approvedUsers = StorageService.getUsers().filter((u) => u.status === 'approved');
  const confessions = StorageService.getConfessions();

  // Sort approved users according to active tab
  const sortedUsers = [...approvedUsers].sort((a, b) => {
    if (activeLeaderboardTab === 'confessions') {
      const countA = confessions.filter((c) => c.userId === a.id).length;
      const countB = confessions.filter((c) => c.userId === b.id).length;
      return countB - countA;
    }
    if (activeLeaderboardTab === 'streaks') {
      return (b.streakDays || 1) - (a.streakDays || 1);
    }
    return (b.xp || 0) - (a.xp || 0);
  });

  const topThree = sortedUsers.slice(0, 3);
  const remaining = sortedUsers.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Community Rankings</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">
            Hall of Besties 🏆
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            See the most active club members, highest XP earners, and gossip royalty!
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveLeaderboardTab('xp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLeaderboardTab === 'xp' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            XP Masters
          </button>
          <button
            onClick={() => setActiveLeaderboardTab('confessions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLeaderboardTab === 'confessions' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Top Tea Spillers
          </button>
          <button
            onClick={() => setActiveLeaderboardTab('streaks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLeaderboardTab === 'streaks' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Longest Streaks
          </button>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-4 max-w-lg mx-auto">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="text-center flex flex-col items-center">
              <div className="text-xl sm:text-2xl mb-1">🥈</div>
              <img
                src={topThree[1].avatarUrl}
                alt=""
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-0.5 object-cover ring-2 ring-slate-300 shadow-md"
              />
              <div className="mt-2 font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[90px]">
                {topThree[1].displayName}
              </div>
              <div className="text-[11px] font-black text-pink-600">
                {activeLeaderboardTab === 'confessions'
                  ? `${confessions.filter((c) => c.userId === topThree[1].id).length} Confessions`
                  : activeLeaderboardTab === 'streaks'
                  ? `${topThree[1].streakDays || 1} Days`
                  : `${topThree[1].xp || 0} XP`}
              </div>
              <div className="w-full bg-slate-200/80 rounded-t-2xl h-16 sm:h-20 mt-2 flex items-center justify-center font-extrabold text-slate-500 text-sm">
                #2
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="text-center flex flex-col items-center -mt-6">
              <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 fill-amber-400 mb-1 animate-bounce" />
              <img
                src={topThree[0].avatarUrl}
                alt=""
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white p-1 object-cover ring-4 ring-amber-400 shadow-lg shadow-amber-200"
              />
              <div className="mt-2 font-extrabold text-xs sm:text-base text-slate-900 truncate max-w-[110px]">
                {topThree[0].displayName}
              </div>
              <div className="text-xs font-black text-amber-600">
                {activeLeaderboardTab === 'confessions'
                  ? `${confessions.filter((c) => c.userId === topThree[0].id).length} Confessions`
                  : activeLeaderboardTab === 'streaks'
                  ? `${topThree[0].streakDays || 1} Days`
                  : `${topThree[0].xp || 0} XP`}
              </div>
              <div className="w-full bg-gradient-to-t from-amber-300 to-yellow-200 rounded-t-2xl h-24 sm:h-28 mt-2 flex items-center justify-center font-black text-amber-800 text-lg shadow-inner">
                #1 👑
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="text-center flex flex-col items-center">
              <div className="text-xl sm:text-2xl mb-1">🥉</div>
              <img
                src={topThree[2].avatarUrl}
                alt=""
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-0.5 object-cover ring-2 ring-amber-700/40 shadow-md"
              />
              <div className="mt-2 font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[90px]">
                {topThree[2].displayName}
              </div>
              <div className="text-[11px] font-black text-purple-600">
                {activeLeaderboardTab === 'confessions'
                  ? `${confessions.filter((c) => c.userId === topThree[2].id).length} Confessions`
                  : activeLeaderboardTab === 'streaks'
                  ? `${topThree[2].streakDays || 1} Days`
                  : `${topThree[2].xp || 0} XP`}
              </div>
              <div className="w-full bg-amber-100/80 rounded-t-2xl h-12 sm:h-14 mt-2 flex items-center justify-center font-extrabold text-amber-800 text-sm">
                #3
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
        <h2 className="font-display font-extrabold text-base text-slate-800 mb-4">
          All Approved Club Members
        </h2>

        {sortedUsers.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400">No approved members yet.</p>
        ) : (
          <div className="divide-y divide-pink-50">
            {sortedUsers.map((user, idx) => {
              const isCurrentUser = currentUser?.id === user.id;
              const userConfessionsCount = confessions.filter((c) => c.userId === user.id).length;

              return (
                <div
                  key={user.id}
                  className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                    isCurrentUser ? 'bg-pink-50/80 border border-pink-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-extrabold text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-2xl bg-pink-100 object-cover ring-1 ring-pink-200"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{user.displayName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold bg-pink-200 text-pink-800 px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                        {user.role === 'owner' && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full">
                            Owner 👑
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        @{user.username} • {user.rankTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-pink-600">
                      {activeLeaderboardTab === 'confessions'
                        ? `${userConfessionsCount} Confessions`
                        : activeLeaderboardTab === 'streaks'
                        ? `${user.streakDays || 1} Days 🔥`
                        : `${user.xp || 0} XP`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      Level {user.level || 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ranks Ladder Breakdown */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 space-y-4">
        <h2 className="font-display font-extrabold text-base text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <span>Member Rank Hierarchy</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {config.levelThresholds.map((tier) => (
            <div
              key={tier.level}
              className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl">
                {tier.badgeEmoji || '🌱'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Lv. {tier.level} - {tier.title}
                </div>
                <div className="text-[11px] text-pink-600 font-semibold">
                  Requires {tier.requiredXp} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
