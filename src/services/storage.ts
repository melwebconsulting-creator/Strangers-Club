import {
  User,
  RegistrationRequest,
  Confession,
  ConfessionComment,
  ChatMessage,
  ChatChannel,
  TruthOrDareItem,
  ThisOrThatItem,
  WouldYouRatherItem,
  Quiz,
  DailyTask,
  UserTaskProgress,
  Announcement,
  DailyQuestion,
  AppNotification,
  ReportItem,
  SiteConfig,
} from '../types';
import { getSupabaseClient } from './supabase';

const KEYS = {
  USERS: 'chika_users_v2',
  REGISTRATION_REQUESTS: 'chika_reg_requests_v2',
  CONFESSIONS: 'chika_confessions_v2',
  COMMENTS: 'chika_comments_v2',
  CHAT_MESSAGES: 'chika_chat_messages_v2',
  CHANNELS: 'chika_channels_v2',
  TRUTH_DARE: 'chika_truth_dare_v2',
  THIS_THAT: 'chika_this_that_v2',
  WOULD_YOU_RATHER: 'chika_would_you_rather_v2',
  QUIZZES: 'chika_quizzes_v2',
  TASKS: 'chika_tasks_v2',
  USER_TASKS: 'chika_user_tasks_v2',
  ANNOUNCEMENTS: 'chika_announcements_v2',
  DAILY_QUESTIONS: 'chika_daily_questions_v2',
  NOTIFICATIONS: 'chika_notifications_v2',
  REPORTS: 'chika_reports_v2',
  SITE_CONFIG: 'chika_site_config_v2',
  CURRENT_USER_SESSION: 'chika_session_v2',
};

// Real-time broadcast channel for multi-tab sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('chika_realtime_network');
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

export function notifyRealtimeChange(eventType: string, payload?: any) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
  }
}

export function subscribeToRealtimeChanges(callback: (type: string, payload: any) => void) {
  if (!broadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type) {
      callback(event.data.type, event.data.payload);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Chika Club',
  tagline: 'The cutest place to spill tea, chill, & make real friends ✨',
  logoEmoji: '🌸',
  primaryColor: '#F472B6', // pastel pink
  accentColor: '#A855F7',  // lavender purple
  backgroundColor: '#FFF8FA', // soft cream/pink
  fontFamily: 'quicksand',
  cardRadius: 'rounded-2xl',
  announcementBanner: {
    enabled: true,
    text: '🎉 Welcome to Chika Club! Read the community rules, say hi in chat, and enjoy!',
  },
  homeHeroTitle: 'Where Real Besties Gather 💕',
  homeHeroSubtitle: 'Spill secret confessions, chat in real-time, play truth or dare, and climb the ranks!',
  confessionsTitle: 'Secret Confessions 💌',
  confessionsSubtitle: 'Share your deepest thoughts, campus crushes, or funny vents anonymously or with your handle.',
  chatTitle: 'The Lounge & Chat 💬',
  chatSubtitle: 'Real-time vibes with approved club members. Pick a channel or chat privately.',
  gamesTitle: 'Chika Arcade 🎮',
  gamesSubtitle: 'Play Truth or Dare, This or That, Would You Rather, and fun trivia quizzes!',
  tasksTitle: 'Daily Quests & XP 🏆',
  tasksSubtitle: 'Complete daily club activities, level up your rank, and earn exclusive badges.',
  communityRules: [
    'Be kind, respectful, and supportive to every member. Zero tolerance for bullying or hate speech.',
    'No doxxing or exposing private personal identities in confessions.',
    'Keep conversations fun, consensual, and appropriate for community members.',
    'Owner approval is required for all new registrations to maintain a safe, troll-free space.',
    'Respect everyone’s privacy in direct messages.',
  ],
  enabledSections: {
    home: true,
    confessions: true,
    chat: true,
    games: true,
    tasks: true,
    leaderboard: true,
    search: true,
  },
  navigationLabels: {
    home: 'Home',
    confessions: 'Confessions',
    chat: 'Chat Room',
    games: 'Games',
    tasks: 'Daily Quests',
    leaderboard: 'Ranks',
  },
  levelThresholds: [
    { level: 1, title: 'Newbie Chismosa', requiredXp: 0, color: '#F472B6', badgeEmoji: '🌱' },
    { level: 2, title: 'Casual Chika', requiredXp: 100, color: '#EC4899', badgeEmoji: '☕' },
    { level: 5, title: 'Certified Bestie', requiredXp: 350, color: '#C084FC', badgeEmoji: '💖' },
    { level: 10, title: 'Tea Spiller VIP', requiredXp: 800, color: '#A855F7', badgeEmoji: '👑' },
    { level: 20, title: 'Gossip Royalty', requiredXp: 2000, color: '#9333EA', badgeEmoji: '✨' },
    { level: 30, title: 'Legendary Icon', requiredXp: 5000, color: '#F59E0B', badgeEmoji: '🌟' },
  ],
};

const DEFAULT_CHANNELS: ChatChannel[] = [
  { id: 'ch-general', name: 'general-chika', description: 'The main hangout for day-to-day tea and banter', icon: '💬', isDefault: true },
  { id: 'ch-late-night', name: 'late-night-talks', description: 'Deep talks, existential thoughts, and 3am vibes', icon: '🌙' },
  { id: 'ch-gaming', name: 'game-zone', description: 'Talk about games, coordinate multiplayer fun, and share wins', icon: '🎮' },
  { id: 'ch-music', name: 'music-and-chill', description: 'Drop Spotify links, playlists, and song recommendations', icon: '🎵' },
  { id: 'ch-secrets', name: 'secret-tea', description: 'Juicy stories, harmless gossip, and dramatic updates', icon: '🍵' },
];

const DEFAULT_TRUTH_OR_DARE: TruthOrDareItem[] = [
  { id: 'td-1', type: 'truth', category: 'cute', question: 'What is the silliest thing you have done to get your crush’s attention?', authorName: 'Chika Club' },
  { id: 'td-2', type: 'truth', category: 'deep', question: 'What is something you wish your friends understood better about you?', authorName: 'Chika Club' },
  { id: 'td-3', type: 'truth', category: 'funny', question: 'What is your most embarrassing guilty pleasure song or show?', authorName: 'Chika Club' },
  { id: 'td-4', type: 'truth', category: 'spicy', question: 'Have you ever secretly stalked someone’s social media for more than an hour?', authorName: 'Chika Club' },
  { id: 'td-5', type: 'dare', category: 'cute', question: 'Send a heartfelt compliment to the last person you messaged in chat!', authorName: 'Chika Club' },
  { id: 'td-6', type: 'dare', category: 'funny', question: 'Write a 2-line dramatic poem about instant noodles or coffee in general chat!', authorName: 'Chika Club' },
  { id: 'td-7', type: 'dare', category: 'spicy', question: 'Post an anonymous confession revealing your most chaotic habit!', authorName: 'Chika Club' },
];

const DEFAULT_THIS_OR_THAT: ThisOrThatItem[] = [
  { id: 'tot-1', optionA: 'Iced Coffee', optionB: 'Matcha Latte', emojiA: '🧋', emojiB: '🍵', votesA: 1, votesB: 0, userVotes: {} },
  { id: 'tot-2', optionA: 'Late Night Talks', optionB: 'Early Morning Walks', emojiA: '🌙', emojiB: '🌅', votesA: 1, votesB: 0, userVotes: {} },
  { id: 'tot-3', optionA: 'Movie Night In', optionB: 'Party Night Out', emojiA: '🍿', emojiB: '💃', votesA: 0, votesB: 1, userVotes: {} },
  { id: 'tot-4', optionA: 'Spill the Tea', optionB: 'Keep It Secret', emojiA: '🍵', emojiB: '🤫', votesA: 1, votesB: 0, userVotes: {} },
];

const DEFAULT_WOULD_YOU_RATHER: WouldYouRatherItem[] = [
  { id: 'wyr-1', scenarioA: 'Always know when someone is lying to you', scenarioB: 'Never feel awkward in any conversation ever again', votesA: 1, votesB: 0, userVotes: {} },
  { id: 'wyr-2', scenarioA: 'Have unlimited free milk tea for life', scenarioB: 'Have unlimited free trips with your besties', votesA: 0, votesB: 1, userVotes: {} },
  { id: 'wyr-3', scenarioA: 'Accidentally send a voice note to the wrong person', scenarioB: 'Accidentally like a 5-year-old post while stalking', votesA: 1, votesB: 0, userVotes: {} },
];

const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'What Kind of Chika Bestie Are You?',
    description: 'Find out if you are the Master Detective, the Loyal Vault, or the Hype Person!',
    category: 'Personality',
    xpReward: 60,
    questions: [
      {
        id: 'q1-1',
        question: 'When juicy news drops in the group, what is your first reaction?',
        options: [
          'Take screenshots and gather receipts immediately 🔍',
          'Listen intently and swear to take it to the grave 🤐',
          'Send 15 voice notes analyzing every single detail 🎙️',
          'Bring snacks and yell "OMG TELL ME EVERYTHING!" 🍿',
        ],
        correctIndex: 0,
        explanation: 'Every bestie brings their own unique superpower to the lounge!',
      },
      {
        id: 'q1-2',
        question: 'What is your ideal midnight activity?',
        options: [
          'Deep conversation about the universe in bed ✨',
          'Scrolling TikTok and sharing funny memes 📱',
          'Watching a cozy romance or mystery drama 🎬',
          'Writing in a diary or listening to acoustic music 🎶',
        ],
        correctIndex: 0,
        explanation: 'Nighttime is peak chika hour!',
      },
      {
        id: 'q1-3',
        question: 'Your friend gets a text from their crush. You:',
        options: [
          'Draft the perfect response for them word-by-word ✍️',
          'Analyze the punctuation and timestamp 🧐',
          'Scream with excitement for them 🥳',
          'Remind them to stay cool and take their time 🧊',
        ],
        correctIndex: 0,
        explanation: 'True friends provide full wing-person support!',
      },
    ],
  },
];

const DEFAULT_TASKS: DailyTask[] = [
  { id: 'task-1', title: 'Say Hi in the Lounge', description: 'Send at least 1 message in any chat channel', icon: '💬', xpReward: 30, actionType: 'chat', targetCount: 1 },
  { id: 'task-2', title: 'Show Some Love', description: 'React to at least 2 confessions with an emoji', icon: '💖', xpReward: 40, actionType: 'reaction', targetCount: 2 },
  { id: 'task-3', title: 'Share Your Story', description: 'Post 1 confession (anonymous or public)', icon: '💌', xpReward: 60, actionType: 'confession', targetCount: 1 },
  { id: 'task-4', title: 'Arcade Player', description: 'Vote on This or That, Would You Rather, or play Truth/Dare', icon: '🎲', xpReward: 35, actionType: 'game', targetCount: 1 },
  { id: 'task-5', title: 'Answer Daily Chika', description: 'Respond to today’s community question', icon: '❓', xpReward: 45, actionType: 'question', targetCount: 1 },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '✨ Welcome to the Official Chika Club Launch!',
    content: 'Welcome to our cozy sanctuary! All members are verified and approved by the club owner to ensure a warm, respectful environment. Feel free to explore the chat rooms, share anonymous confessions, and check out daily quests to level up!',
    tag: 'Important',
    pinned: true,
    authorName: 'Owner',
    createdAt: new Date().toISOString(),
    reactions: { '💖': 3, '🎉': 2 },
  },
];

const DEFAULT_DAILY_QUESTION: DailyQuestion = {
  id: 'dq-today',
  date: new Date().toISOString().split('T')[0],
  question: 'What is one small thing that brought an instant smile to your face recently? 🌸',
  answers: [],
};

// Generic LocalStorage helper with JSON parsing
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export const StorageService = {
  // --- USERS & REGISTRATION ---
  getUsers(): User[] {
    return getStored<User[]>(KEYS.USERS, []);
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    setStored(KEYS.USERS, users);
    notifyRealtimeChange('USERS_UPDATED', user);
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      setStored(KEYS.USERS, users);
      notifyRealtimeChange('USERS_UPDATED', users[idx]);
      return users[idx];
    }
    return null;
  },

  deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    setStored(KEYS.USERS, users);
    notifyRealtimeChange('USERS_UPDATED');
  },

  // Registration Requests
  getRegistrationRequests(): RegistrationRequest[] {
    return getStored<RegistrationRequest[]>(KEYS.REGISTRATION_REQUESTS, []);
  },

  addRegistrationRequest(req: RegistrationRequest): void {
    const requests = this.getRegistrationRequests();
    requests.push(req);
    setStored(KEYS.REGISTRATION_REQUESTS, requests);

    // Add notification for Owner
    this.addNotification({
      id: 'notif-' + Date.now(),
      userId: 'owner',
      title: 'New Member Application! 📬',
      message: `${req.displayName} (@${req.username}) requested to join Chika Club. Review their application in the Owner Panel.`,
      type: 'registration_request',
      read: false,
      createdAt: new Date().toISOString(),
    });

    notifyRealtimeChange('REGISTRATION_REQUEST_CREATED', req);
  },

  approveRegistration(requestId: string, reviewedBy: string): { success: boolean; user?: User } {
    const requests = this.getRegistrationRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { success: false };

    req.status = 'approved';
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = reviewedBy;
    setStored(KEYS.REGISTRATION_REQUESTS, requests);

    // Create or approve active User profile
    const existing = this.getUserById(req.id);
    const userToSave: User = existing
      ? { ...existing, status: 'approved' }
      : {
          id: req.id,
          email: req.email,
          username: req.username,
          displayName: req.displayName,
          avatarUrl: req.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + req.username,
          bio: req.bio || 'Happy member of Chika Club!',
          interests: req.interests || ['Chika', 'Late Night Chats'],
          role: 'member',
          status: 'approved',
          xp: 50, // Welcome XP
          level: 1,
          rankTitle: 'Newbie Chismosa',
          streakDays: 1,
          lastActive: new Date().toISOString(),
          joinedAt: req.submittedAt || new Date().toISOString(),
          badges: ['Approved Member', 'Welcome Bestie'],
        };

    this.saveUser(userToSave);

    // Notify the user
    this.addNotification({
      id: 'notif-appr-' + Date.now(),
      userId: req.id,
      title: 'Welcome to Chika Club! 🎉',
      message: 'Your registration has been approved by the club owner! You now have full access to all chat lounges, confessions, and games.',
      type: 'registration_approved',
      read: false,
      createdAt: new Date().toISOString(),
    });

    notifyRealtimeChange('REGISTRATION_APPROVED', { userId: req.id, user: userToSave });
    return { success: true, user: userToSave };
  },

  rejectRegistration(requestId: string, reviewedBy: string): boolean {
    const requests = this.getRegistrationRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = 'rejected';
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = reviewedBy;
    setStored(KEYS.REGISTRATION_REQUESTS, requests);

    const user = this.getUserById(req.id);
    if (user) {
      user.status = 'rejected';
      this.saveUser(user);
    }

    notifyRealtimeChange('REGISTRATION_REJECTED', { userId: req.id });
    return true;
  },

  // XP & Level calculations
  awardXp(userId: string, amount: number): { newXp: number; newLevel: number; leveledUp: boolean } {
    const user = this.getUserById(userId);
    if (!user) return { newXp: 0, newLevel: 1, leveledUp: false };

    const oldLevel = user.level;
    const config = this.getSiteConfig();
    const newXp = (user.xp || 0) + amount;

    // Find new level based on thresholds
    let newLevel = 1;
    let rankTitle = config.levelThresholds[0]?.title || 'Newbie Chismosa';
    for (const t of config.levelThresholds) {
      if (newXp >= t.requiredXp) {
        newLevel = t.level;
        rankTitle = t.title;
      }
    }

    const leveledUp = newLevel > oldLevel;
    const updated = this.updateUser(userId, {
      xp: newXp,
      level: newLevel,
      rankTitle,
    });

    if (leveledUp && updated) {
      this.addNotification({
        id: 'notif-lvl-' + Date.now(),
        userId,
        title: `Level Up! 🎉 You reached Level ${newLevel}!`,
        message: `Congratulations! Your rank is now "${rankTitle}". Keep being active to earn more perks!`,
        type: 'level_up',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { newXp, newLevel, leveledUp };
  },

  // --- CONFESSIONS ---
  getConfessions(): Confession[] {
    return getStored<Confession[]>(KEYS.CONFESSIONS, []);
  },

  addConfession(confession: Confession): void {
    const list = this.getConfessions();
    list.unshift(confession);
    setStored(KEYS.CONFESSIONS, list);
    notifyRealtimeChange('CONFESSION_ADDED', confession);

    // Track user task progress
    this.recordTaskProgress(confession.userId, 'confession');
    this.awardXp(confession.userId, 25);
  },

  deleteConfession(id: string): void {
    const list = this.getConfessions().filter((c) => c.id !== id);
    setStored(KEYS.CONFESSIONS, list);
    notifyRealtimeChange('CONFESSION_DELETED', id);
  },

  toggleReaction(confessionId: string, userId: string, emoji: string): Confession | null {
    const list = this.getConfessions();
    const confession = list.find((c) => c.id === confessionId);
    if (!confession) return null;

    if (!confession.reactions) confession.reactions = {};
    if (!confession.userReactions) confession.userReactions = {};

    const prevEmoji = confession.userReactions[userId];

    if (prevEmoji === emoji) {
      // Remove reaction
      delete confession.userReactions[userId];
      confession.reactions[emoji] = Math.max(0, (confession.reactions[emoji] || 1) - 1);
    } else {
      // Switch or add
      if (prevEmoji) {
        confession.reactions[prevEmoji] = Math.max(0, (confession.reactions[prevEmoji] || 1) - 1);
      }
      confession.userReactions[userId] = emoji;
      confession.reactions[emoji] = (confession.reactions[emoji] || 0) + 1;

      // Award XP for reacting
      this.recordTaskProgress(userId, 'reaction');
      this.awardXp(userId, 5);
    }

    setStored(KEYS.CONFESSIONS, list);
    notifyRealtimeChange('CONFESSION_REACTION_UPDATED', confession);
    return confession;
  },

  // Comments
  getComments(confessionId: string): ConfessionComment[] {
    const all = getStored<ConfessionComment[]>(KEYS.COMMENTS, []);
    return all.filter((c) => c.confessionId === confessionId);
  },

  addComment(comment: ConfessionComment): void {
    const all = getStored<ConfessionComment[]>(KEYS.COMMENTS, []);
    all.push(comment);
    setStored(KEYS.COMMENTS, all);

    // update confession commentsCount
    const confessions = this.getConfessions();
    const target = confessions.find((c) => c.id === comment.confessionId);
    if (target) {
      target.commentsCount = (target.commentsCount || 0) + 1;
      setStored(KEYS.CONFESSIONS, confessions);
    }

    // Award XP
    this.awardXp(comment.userId, 15);
    notifyRealtimeChange('COMMENT_ADDED', comment);
  },

  addReply(commentId: string, reply: any): void {
    const all = getStored<ConfessionComment[]>(KEYS.COMMENTS, []);
    const comment = all.find((c) => c.id === commentId);
    if (comment) {
      if (!comment.replies) comment.replies = [];
      comment.replies.push(reply);
      setStored(KEYS.COMMENTS, all);

      // update confession commentsCount
      const confessions = this.getConfessions();
      const target = confessions.find((c) => c.id === comment.confessionId);
      if (target) {
        target.commentsCount = (target.commentsCount || 0) + 1;
        setStored(KEYS.CONFESSIONS, confessions);
      }

      this.awardXp(reply.userId, 10);
      notifyRealtimeChange('REPLY_ADDED', { commentId, reply });
    }
  },

  // --- CHAT & MESSAGES ---
  getChannels(): ChatChannel[] {
    const channels = getStored<ChatChannel[]>(KEYS.CHANNELS, []);
    if (channels.length === 0) {
      setStored(KEYS.CHANNELS, DEFAULT_CHANNELS);
      return DEFAULT_CHANNELS;
    }
    return channels;
  },

  saveChannels(channels: ChatChannel[]): void {
    setStored(KEYS.CHANNELS, channels);
    notifyRealtimeChange('CHANNELS_UPDATED', channels);
  },

  getMessages(channelOrDmId: string): ChatMessage[] {
    const all = getStored<ChatMessage[]>(KEYS.CHAT_MESSAGES, []);
    return all.filter((m) => m.channelId === channelOrDmId);
  },

  addMessage(msg: ChatMessage): void {
    const all = getStored<ChatMessage[]>(KEYS.CHAT_MESSAGES, []);
    all.push(msg);
    // Keep last 1500 messages to prevent storage bloat
    const trimmed = all.slice(-1500);
    setStored(KEYS.CHAT_MESSAGES, trimmed);

    // Try sending to Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      client.from('chat_messages').insert({
        channel_id: msg.channelId,
        is_direct_message: msg.isDirectMessage || false,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        sender_username: msg.senderUsername,
        sender_avatar: msg.senderAvatar,
        sender_role: msg.senderRole,
        content: msg.content,
        reply_to: msg.replyTo,
      }).then(({ error }) => {
        if (error) console.warn('Supabase chat insert sync note:', error.message);
      });
    }

    // Award XP and track task
    this.recordTaskProgress(msg.senderId, 'chat');
    this.awardXp(msg.senderId, 4);

    notifyRealtimeChange('CHAT_MESSAGE_ADDED', msg);
  },

  // --- GAMES ---
  getTruthOrDareItems(): TruthOrDareItem[] {
    const items = getStored<TruthOrDareItem[]>(KEYS.TRUTH_DARE, []);
    if (items.length === 0) {
      setStored(KEYS.TRUTH_DARE, DEFAULT_TRUTH_OR_DARE);
      return DEFAULT_TRUTH_OR_DARE;
    }
    return items;
  },

  saveTruthOrDareItems(items: TruthOrDareItem[]): void {
    setStored(KEYS.TRUTH_DARE, items);
    notifyRealtimeChange('GAMES_UPDATED');
  },

  getThisOrThatItems(): ThisOrThatItem[] {
    const items = getStored<ThisOrThatItem[]>(KEYS.THIS_THAT, []);
    if (items.length === 0) {
      setStored(KEYS.THIS_THAT, DEFAULT_THIS_OR_THAT);
      return DEFAULT_THIS_OR_THAT;
    }
    return items;
  },

  saveThisOrThatItems(items: ThisOrThatItem[]): void {
    setStored(KEYS.THIS_THAT, items);
    notifyRealtimeChange('GAMES_UPDATED');
  },

  voteThisOrThat(itemId: string, userId: string, option: 'A' | 'B'): ThisOrThatItem | null {
    const items = this.getThisOrThatItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return null;

    if (!item.userVotes) item.userVotes = {};
    const previous = item.userVotes[userId];

    if (previous === option) return item; // Already voted

    if (previous === 'A') item.votesA = Math.max(0, item.votesA - 1);
    if (previous === 'B') item.votesB = Math.max(0, item.votesB - 1);

    if (option === 'A') item.votesA++;
    if (option === 'B') item.votesB++;

    item.userVotes[userId] = option;
    this.saveThisOrThatItems(items);

    this.recordTaskProgress(userId, 'game');
    this.awardXp(userId, 10);
    return item;
  },

  getWouldYouRatherItems(): WouldYouRatherItem[] {
    const items = getStored<WouldYouRatherItem[]>(KEYS.WOULD_YOU_RATHER, []);
    if (items.length === 0) {
      setStored(KEYS.WOULD_YOU_RATHER, DEFAULT_WOULD_YOU_RATHER);
      return DEFAULT_WOULD_YOU_RATHER;
    }
    return items;
  },

  saveWouldYouRatherItems(items: WouldYouRatherItem[]): void {
    setStored(KEYS.WOULD_YOU_RATHER, items);
    notifyRealtimeChange('GAMES_UPDATED');
  },

  voteWouldYouRather(itemId: string, userId: string, option: 'A' | 'B'): WouldYouRatherItem | null {
    const items = this.getWouldYouRatherItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return null;

    if (!item.userVotes) item.userVotes = {};
    const previous = item.userVotes[userId];

    if (previous === option) return item;

    if (previous === 'A') item.votesA = Math.max(0, item.votesA - 1);
    if (previous === 'B') item.votesB = Math.max(0, item.votesB - 1);

    if (option === 'A') item.votesA++;
    if (option === 'B') item.votesB++;

    item.userVotes[userId] = option;
    this.saveWouldYouRatherItems(items);

    this.recordTaskProgress(userId, 'game');
    this.awardXp(userId, 10);
    return item;
  },

  getQuizzes(): Quiz[] {
    const list = getStored<Quiz[]>(KEYS.QUIZZES, []);
    if (list.length === 0) {
      setStored(KEYS.QUIZZES, DEFAULT_QUIZZES);
      return DEFAULT_QUIZZES;
    }
    return list;
  },

  saveQuizzes(quizzes: Quiz[]): void {
    setStored(KEYS.QUIZZES, quizzes);
    notifyRealtimeChange('GAMES_UPDATED');
  },

  // --- TASKS ---
  getTasks(): DailyTask[] {
    const tasks = getStored<DailyTask[]>(KEYS.TASKS, []);
    if (tasks.length === 0) {
      setStored(KEYS.TASKS, DEFAULT_TASKS);
      return DEFAULT_TASKS;
    }
    return tasks;
  },

  saveTasks(tasks: DailyTask[]): void {
    setStored(KEYS.TASKS, tasks);
    notifyRealtimeChange('TASKS_UPDATED');
  },

  getUserTaskProgress(userId: string): Record<string, UserTaskProgress> {
    const all = getStored<Record<string, Record<string, UserTaskProgress>>>(KEYS.USER_TASKS, {});
    return all[userId] || {};
  },

  recordTaskProgress(userId: string, actionType: 'chat' | 'confession' | 'reaction' | 'game' | 'question'): void {
    const tasks = this.getTasks();
    const all = getStored<Record<string, Record<string, UserTaskProgress>>>(KEYS.USER_TASKS, {});
    if (!all[userId]) all[userId] = {};

    tasks
      .filter((t) => t.actionType === actionType)
      .forEach((t) => {
        const current = all[userId][t.id] || {
          userId,
          taskId: t.id,
          currentCount: 0,
          completed: false,
          claimed: false,
          updatedAt: new Date().toISOString(),
        };

        if (!current.completed) {
          current.currentCount = (current.currentCount || 0) + 1;
          if (current.currentCount >= t.targetCount) {
            current.completed = true;
          }
          current.updatedAt = new Date().toISOString();
          all[userId][t.id] = current;
        }
      });

    setStored(KEYS.USER_TASKS, all);
    notifyRealtimeChange('TASKS_UPDATED');
  },

  claimTaskReward(userId: string, taskId: string): boolean {
    const all = getStored<Record<string, Record<string, UserTaskProgress>>>(KEYS.USER_TASKS, {});
    if (!all[userId] || !all[userId][taskId]) return false;

    const progress = all[userId][taskId];
    if (progress.completed && !progress.claimed) {
      progress.claimed = true;
      setStored(KEYS.USER_TASKS, all);

      const task = this.getTasks().find((t) => t.id === taskId);
      if (task) {
        this.awardXp(userId, task.xpReward);
      }
      notifyRealtimeChange('TASKS_UPDATED');
      return true;
    }
    return false;
  },

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): Announcement[] {
    const list = getStored<Announcement[]>(KEYS.ANNOUNCEMENTS, []);
    if (list.length === 0) {
      setStored(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
      return DEFAULT_ANNOUNCEMENTS;
    }
    return list;
  },

  saveAnnouncements(list: Announcement[]): void {
    setStored(KEYS.ANNOUNCEMENTS, list);
    notifyRealtimeChange('ANNOUNCEMENTS_UPDATED');
  },

  // --- DAILY QUESTIONS ---
  getDailyQuestion(): DailyQuestion {
    const dq = getStored<DailyQuestion>(KEYS.DAILY_QUESTIONS, DEFAULT_DAILY_QUESTION);
    return dq;
  },

  answerDailyQuestion(userId: string, displayName: string, avatarUrl: string, answerText: string): DailyQuestion {
    const dq = this.getDailyQuestion();
    if (!dq.answers) dq.answers = [];

    const existingIdx = dq.answers.findIndex((a) => a.userId === userId);
    const newAnswer = {
      id: 'ans-' + Date.now(),
      userId,
      displayName,
      avatarUrl,
      answer: answerText,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    if (existingIdx >= 0) {
      dq.answers[existingIdx] = newAnswer;
    } else {
      dq.answers.unshift(newAnswer);
    }

    setStored(KEYS.DAILY_QUESTIONS, dq);
    this.recordTaskProgress(userId, 'question');
    this.awardXp(userId, 20);
    notifyRealtimeChange('DAILY_QUESTION_UPDATED', dq);
    return dq;
  },

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): AppNotification[] {
    const all = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, []);
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  },

  addNotification(notif: AppNotification): void {
    const all = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, []);
    all.unshift(notif);
    // keep 500 max
    setStored(KEYS.NOTIFICATIONS, all.slice(0, 500));
    notifyRealtimeChange('NOTIFICATIONS_UPDATED', notif);
  },

  markNotificationAsRead(id: string): void {
    const all = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, []);
    const target = all.find((n) => n.id === id);
    if (target) {
      target.read = true;
      setStored(KEYS.NOTIFICATIONS, all);
      notifyRealtimeChange('NOTIFICATIONS_UPDATED');
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const all = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, []);
    all.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    setStored(KEYS.NOTIFICATIONS, all);
    notifyRealtimeChange('NOTIFICATIONS_UPDATED');
  },

  // --- REPORTS ---
  getReports(): ReportItem[] {
    return getStored<ReportItem[]>(KEYS.REPORTS, []);
  },

  addReport(report: ReportItem): void {
    const all = this.getReports();
    all.unshift(report);
    setStored(KEYS.REPORTS, all);

    // Notify owner
    this.addNotification({
      id: 'notif-rep-' + Date.now(),
      userId: 'owner',
      title: 'New Moderation Report ⚠️',
      message: `${report.reportedByUsername} reported a ${report.targetType} for: "${report.reason}". Please review in the Owner Panel.`,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString(),
    });

    notifyRealtimeChange('REPORTS_UPDATED', report);
  },

  resolveReport(id: string, status: 'resolved' | 'dismissed'): void {
    const all = this.getReports();
    const item = all.find((r) => r.id === id);
    if (item) {
      item.status = status;
      setStored(KEYS.REPORTS, all);
      notifyRealtimeChange('REPORTS_UPDATED');
    }
  },

  // --- SITE CONFIG ---
  getSiteConfig(): SiteConfig {
    const config = getStored<SiteConfig>(KEYS.SITE_CONFIG, DEFAULT_SITE_CONFIG);
    return { ...DEFAULT_SITE_CONFIG, ...config };
  },

  saveSiteConfig(config: SiteConfig): void {
    setStored(KEYS.SITE_CONFIG, config);

    // Try saving to Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      client.from('site_config').upsert({
        id: 'current_config',
        data: config,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('Supabase site_config sync note:', error.message);
      });
    }

    notifyRealtimeChange('CONFIG_UPDATED', config);
  },
};
