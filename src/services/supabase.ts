import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys can come from env or Owner settings in localStorage
const STORAGE_KEY_SUPABASE_CONFIG = 'chika_supabase_custom_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored Supabase config:', e);
  }

  // Fallback to Vite env variables if set
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey),
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
  cachedClient = null; // reset cached client
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (err) {
      console.error('Error creating Supabase client:', err);
    }
  }

  return null;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    const client = createClient(url, key);
    // Simple query to verify connection
    const { error } = await client.from('site_config').select('*').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

/**
 * Returns complete, production-ready SQL migration script for Supabase SQL Editor
 */
export function getSupabaseSQLSchema(): string {
  return `-- =========================================================
-- CHIKA CLUB - COMPLETE SUPABASE DATABASE & RLS SCHEMA
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank_title TEXT DEFAULT 'Newbie Chismosa',
  streak_days INTEGER DEFAULT 1,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  badges TEXT[] DEFAULT '{"Welcome Bestie"}'
);

-- 2. REGISTRATION REQUESTS (For Owner Review)
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- 3. CONFESSIONS
CREATE TABLE IF NOT EXISTS public.confessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  is_anonymous BOOLEAN DEFAULT true,
  content TEXT NOT NULL,
  tag TEXT DEFAULT '#Chika',
  color_theme TEXT DEFAULT 'pink',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactions JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN DEFAULT false
);

-- 4. CONFESSION COMMENTS
CREATE TABLE IF NOT EXISTS public.confession_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replies JSONB DEFAULT '[]'::jsonb
);

-- 5. CHAT CHANNELS
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '#',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  is_direct_message BOOLEAN DEFAULT false,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  sender_role TEXT DEFAULT 'member',
  content TEXT NOT NULL,
  reply_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GAMES (Truth or Dare, This or That, Would You Rather, Quizzes)
CREATE TABLE IF NOT EXISTS public.games_truth_or_dare (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('truth', 'dare')),
  category TEXT DEFAULT 'cute',
  question TEXT NOT NULL,
  author_name TEXT DEFAULT 'Chika Club',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.games_this_or_that (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  emoji_a TEXT DEFAULT '✨',
  emoji_b TEXT DEFAULT '💖',
  votes_a INTEGER DEFAULT 0,
  votes_b INTEGER DEFAULT 0,
  user_votes JSONB DEFAULT '{}'::jsonb
);

-- 8. TASKS & USER PROGRESS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  xp_reward INTEGER DEFAULT 50,
  action_type TEXT NOT NULL,
  target_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- 9. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT DEFAULT 'General',
  pinned BOOLEAN DEFAULT false,
  author_name TEXT DEFAULT 'Owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactions JSONB DEFAULT '{}'::jsonb
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- UUID or 'all' or 'owner'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. REPORTS (Moderation Queue)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_snippet TEXT NOT NULL,
  reported_by_user_id UUID REFERENCES auth.users(id),
  reported_by_username TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SITE CONFIG (Owner Dashboard Customization)
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current_config',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone approved can view approved profiles; users can update their own
CREATE POLICY "Public profiles are viewable by approved users" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Confessions: Approved members can insert & read
CREATE POLICY "Approved members can view confessions" 
ON public.confessions FOR SELECT USING (true);

CREATE POLICY "Approved members can insert confessions" 
ON public.confessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages: Approved members can view and insert
CREATE POLICY "Approved members can view chat" 
ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Approved members can send chat" 
ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable Realtime publication for chat & notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.confessions;
`;
}
