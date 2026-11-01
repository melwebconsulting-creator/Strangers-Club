import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/storage';
import { TruthOrDareItem, ThisOrThatItem, WouldYouRatherItem, Quiz } from '../types';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  Sparkles,
  Shuffle,
  Plus,
  HelpCircle,
  CheckCircle,
  Trophy,
  Flame,
  Heart,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface GamesPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const GamesPage: React.FC<GamesPageProps> = ({ onOpenAuth }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { config } = useTheme();

  const [activeGameTab, setActiveGameTab] = useState<'truth_dare' | 'this_that' | 'would_rather' | 'quizzes' | 'fortune'>('truth_dare');

  // TRUTH OR DARE STATE
  const [truthOrDareList, setTruthOrDareList] = useState<TruthOrDareItem[]>(() => StorageService.getTruthOrDareItems());
  const [selectedType, setSelectedType] = useState<'truth' | 'dare'>('truth');
  const [currentItem, setCurrentItem] = useState<TruthOrDareItem | null>(null);
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState<'cute' | 'spicy' | 'funny' | 'deep'>('cute');

  // THIS OR THAT STATE
  const [thisOrThatList, setThisOrThatList] = useState<ThisOrThatItem[]>(() => StorageService.getThisOrThatItems());

  // WOULD YOU RATHER STATE
  const [wouldRatherList, setWouldRatherList] = useState<WouldYouRatherItem[]>(() => StorageService.getWouldYouRatherItems());

  // QUIZ STATE
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => StorageService.getQuizzes());
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // DAILY FORTUNE STATE
  const [fortuneOpened, setFortuneOpened] = useState(false);
  const [fortuneAdvice, setFortuneAdvice] = useState('');

  const FORTUNES = [
    '✨ Today is the day someone secretly thinks about your sweet smile. Keep shining!',
    '🍵 Juicy positive tea is coming your way before the sunset. Be ready!',
    '💖 Your vibe attracts true besties. Reach out to someone in chat today!',
    '🌟 A lucky surprise will brighten your week. Trust your intuition!',
    '🎀 Self-care is not selfish. Treat yourself to your favorite drink today!',
  ];

  // TRUTH OR DARE ACTIONS
  const handleDrawPrompt = (type: 'truth' | 'dare') => {
    setSelectedType(type);
    const pool = truthOrDareList.filter((item) => item.type === type);
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setCurrentItem(random);
    }
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const newItem: TruthOrDareItem = {
      id: 'td-' + Date.now(),
      type: selectedType,
      category: newCategory,
      question: newQuestion.trim(),
      authorName: currentUser.displayName,
    };

    const updated = [...truthOrDareList, newItem];
    setTruthOrDareList(updated);
    StorageService.saveTruthOrDareItems(updated);
    setCurrentItem(newItem);
    setNewQuestion('');
    setIsAddingPrompt(false);
    StorageService.awardXp(currentUser.id, 20);
  };

  // THIS OR THAT ACTIONS
  const handleVoteThisOrThat = (itemId: string, option: 'A' | 'B') => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }
    const updated = StorageService.voteThisOrThat(itemId, currentUser.id, option);
    if (updated) {
      setThisOrThatList(StorageService.getThisOrThatItems());
    }
  };

  // WOULD YOU RATHER ACTIONS
  const handleVoteWouldRather = (itemId: string, option: 'A' | 'B') => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }
    const updated = StorageService.voteWouldYouRather(itemId, currentUser.id, option);
    if (updated) {
      setWouldRatherList(StorageService.getWouldYouRatherItems());
    }
  };

  // QUIZ ACTIONS
  const handleStartQuiz = (q: Quiz) => {
    setActiveQuiz(q);
    setQuizStep(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);
  };

  const handlePickAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (activeQuiz && activeQuiz.questions[quizStep].correctIndex === index) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizStep = () => {
    if (!activeQuiz) return;
    if (quizStep + 1 < activeQuiz.questions.length) {
      setQuizStep((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
      if (currentUser) {
        StorageService.awardXp(currentUser.id, activeQuiz.xpReward);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // DAILY FORTUNE ACTION
  const handleOpenFortune = () => {
    if (fortuneOpened) return;
    const random = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    setFortuneAdvice(random);
    setFortuneOpened(true);
    if (currentUser) {
      StorageService.awardXp(currentUser.id, 25);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Community Arcade</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">
            {config.gamesTitle || 'Chika Arcade 🎮'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {config.gamesSubtitle ||
              'Play Truth or Dare, vote on This or That, choose Would You Rather dilemmas, and unlock rewards!'}
          </p>
        </div>

        {/* Fortune Quick Cookie */}
        <button
          onClick={handleOpenFortune}
          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-200 hover:scale-102 transition-transform cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🥠</span>
          <span>{fortuneOpened ? 'Daily Advice Claimed!' : 'Daily Fortune Cookie (+25 XP)'}</span>
        </button>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'truth_dare', label: 'Truth or Dare 🎭', icon: Flame },
          { id: 'this_that', label: 'This or That ⚖️', icon: Shuffle },
          { id: 'would_rather', label: 'Would You Rather 🤔', icon: HelpCircle },
          { id: 'quizzes', label: 'Quizzes & Trivia 🧠', icon: Trophy },
        ].map((tab) => {
          const isActive = activeGameTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGameTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200'
                  : 'bg-white text-slate-600 hover:bg-pink-50 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRUTH OR DARE */}
      {activeGameTab === 'truth_dare' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-800">
                Truth or Dare Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Draw a question to share in general chat or answer right here!
              </p>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) onOpenAuth('login');
                else setIsAddingPrompt(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit a Truth/Dare</span>
            </button>
          </div>

          {/* Action Choice Buttons */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleDrawPrompt('truth')}
              className="py-4 px-6 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-base shadow-lg shadow-pink-200 hover:scale-103 active:scale-97 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span className="text-2xl">🤫</span>
              <span>TRUTH</span>
            </button>

            <button
              onClick={() => handleDrawPrompt('dare')}
              className="py-4 px-6 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-base shadow-lg shadow-purple-200 hover:scale-103 active:scale-97 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span className="text-2xl">🔥</span>
              <span>DARE</span>
            </button>
          </div>

          {/* Display Card */}
          {currentItem ? (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 border border-pink-200 text-center space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-bold text-pink-700 border border-pink-200">
                <span className="uppercase">{currentItem.type}</span> •{' '}
                <span className="capitalize">{currentItem.category}</span>
              </div>

              <h3 className="font-display font-bold text-lg sm:text-xl text-slate-800 leading-relaxed">
                "{currentItem.question}"
              </h3>

              <div className="text-xs text-slate-400">Added by {currentItem.authorName || 'Chika Club'}</div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => handleDrawPrompt(selectedType)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Next {selectedType.toUpperCase()}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Click either <strong className="text-pink-600">TRUTH</strong> or{' '}
              <strong className="text-purple-600">DARE</strong> above to spin your prompt!
            </div>
          )}

          {/* Modal to add prompt */}
          {isAddingPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100">
                <h3 className="font-bold text-slate-800 text-base mb-3">Add Community Truth or Dare</h3>
                <form onSubmit={handleAddPrompt} className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedType('truth')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${
                        selectedType === 'truth' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Truth
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedType('dare')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${
                        selectedType === 'dare' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Dare
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vibe Category</label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200"
                    >
                      <option value="cute">Cute & Playful</option>
                      <option value="funny">Hilarious</option>
                      <option value="deep">Deep & Meaningful</option>
                      <option value="spicy">Juicy / Spicy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prompt / Question</label>
                    <textarea
                      required
                      rows={3}
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g. Tell us your funniest guilty pleasure habit..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPrompt(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold"
                    >
                      Submit (+20 XP)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: THIS OR THAT */}
      {activeGameTab === 'this_that' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
            <h2 className="font-display font-extrabold text-xl text-slate-800">
              This or That? ⚖️
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vote on cute dilemmas to reveal how the rest of the club voted!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thisOrThatList.map((item) => {
              const totalVotes = item.votesA + item.votesB;
              const pctA = totalVotes > 0 ? Math.round((item.votesA / totalVotes) * 100) : 50;
              const pctB = totalVotes > 0 ? 100 - pctA : 50;
              const myVote = currentUser ? item.userVotes?.[currentUser.id] : undefined;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* Option A */}
                    <button
                      onClick={() => handleVoteThisOrThat(item.id, 'A')}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                        myVote === 'A'
                          ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-300'
                          : 'border-slate-200 hover:border-pink-300 hover:bg-pink-50/40'
                      }`}
                    >
                      <div className="text-3xl mb-1">{item.emojiA}</div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800">{item.optionA}</div>
                      {myVote && (
                        <div className="text-xs font-extrabold text-pink-600 mt-2">
                          {pctA}% <span className="text-[10px] text-slate-400">({item.votesA} votes)</span>
                        </div>
                      )}
                    </button>

                    {/* Option B */}
                    <button
                      onClick={() => handleVoteThisOrThat(item.id, 'B')}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                        myVote === 'B'
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="text-3xl mb-1">{item.emojiB}</div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800">{item.optionB}</div>
                      {myVote && (
                        <div className="text-xs font-extrabold text-purple-600 mt-2">
                          {pctB}% <span className="text-[10px] text-slate-400">({item.votesB} votes)</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {!myVote && (
                    <div className="text-center text-[11px] text-slate-400 font-medium">
                      Click either side to cast your vote!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WOULD YOU RATHER */}
      {activeGameTab === 'would_rather' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
            <h2 className="font-display font-extrabold text-xl text-slate-800">
              Would You Rather? 🤔
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tough choices, hilarious consequences. Pick your side!
            </p>
          </div>

          <div className="space-y-4">
            {wouldRatherList.map((item) => {
              const total = item.votesA + item.votesB;
              const pctA = total > 0 ? Math.round((item.votesA / total) * 100) : 50;
              const pctB = total > 0 ? 100 - pctA : 50;
              const myVote = currentUser ? item.userVotes?.[currentUser.id] : undefined;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleVoteWouldRather(item.id, 'A')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        myVote === 'A'
                          ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-300'
                          : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-pink-600 block mb-1">Option A</span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{item.scenarioA}</p>
                      {myVote && (
                        <div className="mt-3 text-xs font-black text-pink-600">{pctA}% of besties chose this</div>
                      )}
                    </button>

                    <button
                      onClick={() => handleVoteWouldRather(item.id, 'B')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        myVote === 'B'
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                          : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-purple-600 block mb-1">Option B</span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{item.scenarioB}</p>
                      {myVote && (
                        <div className="mt-3 text-xs font-black text-purple-600">{pctB}% of besties chose this</div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: QUIZZES */}
      {activeGameTab === 'quizzes' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100 space-y-6">
          {!activeQuiz ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-extrabold text-xl text-slate-800">
                  Chika Quiz Arena 🧠
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Play personality and trivia quizzes to earn big XP rewards!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-5 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-800">
                        {quiz.category}
                      </span>
                      <span className="text-xs font-black text-purple-600">+{quiz.xpReward} XP</span>
                    </div>

                    <h3 className="font-display font-bold text-slate-800 text-base">{quiz.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{quiz.description}</p>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Take Quiz</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : quizCompleted ? (
            <div className="text-center py-8 max-w-md mx-auto space-y-4">
              <div className="text-5xl">🏆</div>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">Quiz Completed!</h3>
              <p className="text-xs text-slate-600">
                You answered {quizScore} out of {activeQuiz.questions.length} questions!
              </p>
              <div className="p-4 rounded-2xl bg-pink-50 text-pink-700 font-extrabold text-sm border border-pink-200">
                🎉 +{activeQuiz.xpReward} XP Added to your Member Profile!
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
              >
                Back to Quizzes
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-pink-600">
                  Question {quizStep + 1} of {activeQuiz.questions.length}
                </span>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Exit Quiz
                </button>
              </div>

              <h3 className="font-display font-bold text-base sm:text-lg text-slate-800 leading-relaxed">
                {activeQuiz.questions[quizStep].question}
              </h3>

              <div className="space-y-2.5">
                {activeQuiz.questions[quizStep].options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = activeQuiz.questions[quizStep].correctIndex === idx;

                  let btnStyle = 'border-slate-200 bg-white hover:bg-pink-50 hover:border-pink-200';
                  if (selectedAnswer !== null) {
                    if (isSelected) {
                      btnStyle = isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-pink-500 bg-pink-50 text-pink-800';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePickAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="pt-2">
                  <button
                    onClick={handleNextQuizStep}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-200 hover:scale-[1.01] transition-all"
                  >
                    {quizStep + 1 < activeQuiz.questions.length ? 'Next Question →' : 'Finish Quiz & Claim XP 🎉'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FORTUNE MODAL */}
      {fortuneAdvice && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-pink-50 border border-amber-200 text-center space-y-1">
          <div className="text-xs font-extrabold text-amber-700">🥠 Today’s Chika Fortune:</div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 italic">"{fortuneAdvice}"</p>
        </div>
      )}
    </div>
  );
};
