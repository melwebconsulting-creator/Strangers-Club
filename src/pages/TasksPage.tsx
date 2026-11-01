import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService, subscribeToRealtimeChanges } from '../services/storage';
import { DailyTask, UserTaskProgress } from '../types';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Gift,
  ArrowUpRight,
  Trophy,
} from 'lucide-react';

interface TasksPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigate: (tab: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onOpenAuth, onNavigate }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { config } = useTheme();

  const [tasks, setTasks] = useState<DailyTask[]>(() => StorageService.getTasks());
  const [userProgress, setUserProgress] = useState<Record<string, UserTaskProgress>>(() =>
    currentUser ? StorageService.getUserTaskProgress(currentUser.id) : {}
  );

  useEffect(() => {
    if (currentUser) {
      setUserProgress(StorageService.getUserTaskProgress(currentUser.id));
    }
  }, [currentUser]);

  useEffect(() => {
    const unsub = subscribeToRealtimeChanges((type) => {
      if (type === 'TASKS_UPDATED') {
        setTasks(StorageService.getTasks());
        if (currentUser) {
          setUserProgress(StorageService.getUserTaskProgress(currentUser.id));
        }
      }
    });
    return unsub;
  }, [currentUser]);

  const handleClaim = (taskId: string) => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const success = StorageService.claimTaskReward(currentUser.id, taskId);
    if (success) {
      setUserProgress(StorageService.getUserTaskProgress(currentUser.id));
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  // Find next level info
  const currentXp = currentUser?.xp || 0;
  const currentLevel = currentUser?.level || 1;
  const thresholds = config.levelThresholds || [];
  const nextThreshold = thresholds.find((t) => t.requiredXp > currentXp);
  const currentThreshold = [...thresholds].reverse().find((t) => t.requiredXp <= currentXp) || thresholds[0];

  const xpIntoCurrentLevel = currentXp - (currentThreshold?.requiredXp || 0);
  const xpSpan = (nextThreshold?.requiredXp || currentXp + 200) - (currentThreshold?.requiredXp || 0);
  const progressPct = Math.min(100, Math.max(0, Math.round((xpIntoCurrentLevel / (xpSpan || 1)) * 100)));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Challenges & Rewards</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">
            {config.tasksTitle || 'Daily Quests & XP 🏆'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {config.tasksSubtitle ||
              'Complete everyday club activities, level up your member rank, and claim sweet XP rewards!'}
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200">
          <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
            <Flame className="w-6 h-6 fill-orange-500" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-800">
              {currentUser?.streakDays || 1} Day Streak
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">Active Club Member 🔥</div>
          </div>
        </div>
      </div>

      {/* Level Progress Card */}
      {currentUser && (
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-pink-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-12 h-12 rounded-2xl bg-white p-0.5 object-cover ring-2 ring-white/50"
              />
              <div>
                <h3 className="font-display font-extrabold text-lg leading-tight">
                  Level {currentLevel}: {currentUser.rankTitle}
                </h3>
                <p className="text-xs text-pink-100 font-medium">
                  {currentXp} Total XP Earned
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('leaderboard')}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>View Leaderboard</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-pink-100 font-semibold mb-1.5">
              <span>Next Rank Milestone: {nextThreshold?.title || 'Max Rank'}</span>
              <span>{nextThreshold ? `${currentXp} / ${nextThreshold.requiredXp} XP` : 'MAX LEVEL'}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-all duration-500 shadow-xs"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        <h2 className="font-display font-extrabold text-lg text-slate-800">Today’s Quest Board</h2>

        <div className="space-y-3">
          {tasks.map((task) => {
            const prog = currentUser ? userProgress[task.id] : undefined;
            const currentCount = prog?.currentCount || 0;
            const isCompleted = currentCount >= task.targetCount;
            const isClaimed = prog?.claimed || false;
            const taskPct = Math.min(100, Math.round((currentCount / task.targetCount) * 100));

            return (
              <div
                key={task.id}
                className={`p-5 rounded-3xl bg-white border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isClaimed
                    ? 'border-slate-100 opacity-70 bg-slate-50/50'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-pink-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-2xl shrink-0">
                    {task.icon || '⭐'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
                      <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        +{task.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{task.description}</p>

                    {/* Progress mini indicator */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${taskPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {Math.min(currentCount, task.targetCount)} / {task.targetCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <div className="self-end sm:self-auto">
                  {isClaimed ? (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Claimed</span>
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(task.id)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-bounce"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Claim +{task.xpReward} XP!</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
