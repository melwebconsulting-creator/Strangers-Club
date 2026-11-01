export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  interests: string[];
  role: UserRole;
  status: RegistrationStatus;
  xp: number;
  level: number;
  rankTitle: string;
  streakDays: number;
  lastActive: string;
  joinedAt: string;
  badges: string[];
}

export interface RegistrationRequest {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  interests: string[];
  submittedAt: string;
  status: RegistrationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ConfessionReaction {
  id: string;
  confessionId: string;
  userId: string;
  emoji: '❤️' | '😂' | '😮' | '😢' | '🔥' | '🥺';
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOwner?: boolean;
  content: string;
  createdAt: string;
}

export interface ConfessionComment {
  id: string;
  confessionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOwner?: boolean;
  content: string;
  createdAt: string;
  replies: CommentReply[];
}

export interface Confession {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isAnonymous: boolean;
  content: string;
  tag: string;
  colorTheme: string;
  createdAt: string;
  reactions: Record<string, number>; // emoji -> count
  userReactions: Record<string, string>; // userId -> emoji
  commentsCount: number;
  isPinned?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId?: string; // channel or dm id
  isDirectMessage?: boolean;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}

export interface DirectConversation {
  id: string;
  participantIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface TruthOrDareItem {
  id: string;
  type: 'truth' | 'dare';
  category: 'cute' | 'spicy' | 'funny' | 'deep';
  question: string;
  authorName?: string;
}

export interface ThisOrThatItem {
  id: string;
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
  votesA: number;
  votesB: number;
  userVotes: Record<string, 'A' | 'B'>;
}

export interface WouldYouRatherItem {
  id: string;
  scenarioA: string;
  scenarioB: string;
  votesA: number;
  votesB: number;
  userVotes: Record<string, 'A' | 'B'>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  questions: QuizQuestion[];
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  actionType: 'chat' | 'confession' | 'reaction' | 'game' | 'question';
  targetCount: number;
}

export interface UserTaskProgress {
  userId: string;
  taskId: string;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: string;
  pinned: boolean;
  authorName: string;
  createdAt: string;
  reactions: Record<string, number>;
}

export interface DailyQuestion {
  id: string;
  question: string;
  date: string;
  answers: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
    answer: string;
    createdAt: string;
    likes: number;
  }[];
}

export interface AppNotification {
  id: string;
  userId: string; // target user ('all' or specific user id)
  title: string;
  message: string;
  type: 'registration_request' | 'registration_approved' | 'comment' | 'reaction' | 'announcement' | 'level_up' | 'task';
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  targetType: 'confession' | 'comment' | 'chat_message' | 'user';
  targetId: string;
  targetSnippet: string;
  reportedByUserId: string;
  reportedByUsername: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  logoEmoji: string;
  logoUrl?: string;
  primaryColor: string; // e.g. #EC4899
  accentColor: string;  // e.g. #A855F7
  backgroundColor: string; // e.g. #FFF8FA
  fontFamily: 'quicksand' | 'jakarta' | 'nunito';
  cardRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  announcementBanner: {
    enabled: boolean;
    text: string;
  };
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  confessionsTitle: string;
  confessionsSubtitle: string;
  chatTitle: string;
  chatSubtitle: string;
  gamesTitle: string;
  gamesSubtitle: string;
  tasksTitle: string;
  tasksSubtitle: string;
  communityRules: string[];
  enabledSections: {
    home: boolean;
    confessions: boolean;
    chat: boolean;
    games: boolean;
    tasks: boolean;
    leaderboard: boolean;
    search: boolean;
  };
  navigationLabels: {
    home: string;
    confessions: string;
    chat: string;
    games: string;
    tasks: string;
    leaderboard: string;
  };
  levelThresholds: {
    level: number;
    title: string;
    requiredXp: number;
    color: string;
    badgeEmoji: string;
  }[];
}
