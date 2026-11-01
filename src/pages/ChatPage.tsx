import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StorageService, subscribeToRealtimeChanges, notifyRealtimeChange } from '../services/storage';
import { ChatChannel, ChatMessage, User } from '../types';
import {
  MessageCircle,
  Send,
  Smile,
  Reply,
  X,
  Search,
  Hash,
  User as UserIcon,
  Crown,
  Shield,
  Circle,
  Plus,
  Lock,
} from 'lucide-react';

interface ChatPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const EMOJI_PALETTE = [
  '💖', '🌸', '✨', '☕', '🍵', '🎀', '🧁', '🥺', '😂', '🔥', '👑', '🥳', '🍿', '🌙', '💅', '👀', '💯', '💌', '🧸', '🍓',
];

export const ChatPage: React.FC<ChatPageProps> = ({ onOpenAuth }) => {
  const { currentUser, isAuthenticated, isOwner } = useAuth();
  const { config } = useTheme();

  const [channels, setChannels] = useState<ChatChannel[]>(() => StorageService.getChannels());
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [isDirectMessage, setIsDirectMessage] = useState(false);
  const [selectedDmUser, setSelectedDmUser] = useState<User | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Approved members for Direct Messages
  const approvedMembers = StorageService.getUsers().filter(
    (u) => u.status === 'approved' && (!currentUser || u.id !== currentUser.id)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Compute DM room ID consistently
  const getDmRoomId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_dm_');
  };

  const currentRoomId = isDirectMessage && selectedDmUser && currentUser
    ? getDmRoomId(currentUser.id, selectedDmUser.id)
    : activeChannelId;

  // Load messages
  const loadMessages = () => {
    if (currentRoomId) {
      setMessages(StorageService.getMessages(currentRoomId));
    }
  };

  useEffect(() => {
    loadMessages();
  }, [currentRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToRealtimeChanges((type, payload) => {
      if (type === 'CHAT_MESSAGE_ADDED') {
        if (payload?.channelId === currentRoomId) {
          setMessages(StorageService.getMessages(currentRoomId));
        }
      } else if (type === 'CHANNELS_UPDATED') {
        setChannels(StorageService.getChannels());
      } else if (type === 'USER_TYPING') {
        if (payload?.roomId === currentRoomId && payload?.username !== currentUser?.username) {
          setTypingUsers((prev) => (prev.includes(payload.displayName) ? prev : [...prev, payload.displayName]));
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((name) => name !== payload.displayName));
          }, 3000);
        }
      }
    });
    return unsub;
  }, [currentRoomId, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!isAuthenticated || !currentUser) {
      onOpenAuth('login');
      return;
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      channelId: currentRoomId,
      isDirectMessage,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderUsername: currentUser.username,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
    };

    StorageService.addMessage(newMsg);
    setMessages(StorageService.getMessages(currentRoomId));
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (currentUser && currentRoomId) {
      if (!typingTimeoutRef.current) {
        notifyRealtimeChange('USER_TYPING', {
          roomId: currentRoomId,
          username: currentUser.username,
          displayName: currentUser.displayName,
        });
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2500);
      }
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const filteredMessages = chatSearchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : messages;

  const currentChannelObj = channels.find((c) => c.id === activeChannelId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-130px)] min-h-[580px] flex flex-col animate-fadeIn">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Channels & Direct Messages */}
        <div className="w-64 sm:w-72 bg-pink-50/40 border-r border-pink-100/80 flex flex-col shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-pink-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-pink-100 text-pink-600">
                <MessageCircle className="w-4 h-4" />
              </div>
              <h3 className="font-display font-extrabold text-sm text-slate-800">The Lounge</h3>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>

          {/* List of Channels & DMs */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Public Channels */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Chat Channels
              </div>
              <div className="space-y-1">
                {channels.map((ch) => {
                  const isActive = !isDirectMessage && activeChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setIsDirectMessage(false);
                        setSelectedDmUser(null);
                        setActiveChannelId(ch.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-pink-100/60'
                      }`}
                    >
                      <span className="text-sm">{ch.icon || '#'}</span>
                      <span className="truncate flex-1">#{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                <span>Direct Messages</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>

              {approvedMembers.length === 0 ? (
                <p className="px-2 text-[11px] text-slate-400 italic">No other approved members yet.</p>
              ) : (
                <div className="space-y-1">
                  {approvedMembers.map((member) => {
                    const isActive = isDirectMessage && selectedDmUser?.id === member.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          if (!isAuthenticated) {
                            onOpenAuth('login');
                            return;
                          }
                          setIsDirectMessage(true);
                          setSelectedDmUser(member);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-pink-100/60'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={member.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full bg-white object-cover"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                        </div>
                        <div className="truncate flex-1">
                          <div className="truncate leading-tight">{member.displayName}</div>
                          <div className={`text-[10px] font-medium leading-tight truncate ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                            @{member.username}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-pink-100/80 flex items-center justify-between bg-white/70 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              {isDirectMessage && selectedDmUser ? (
                <>
                  <div className="relative">
                    <img
                      src={selectedDmUser.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-2xl bg-purple-100 object-cover ring-2 ring-purple-200"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <span>{selectedDmUser.displayName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        Private DM
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      @{selectedDmUser.username} • {selectedDmUser.rankTitle}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base">
                    {currentChannelObj?.icon || '#'}
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-800">
                      #{currentChannelObj?.name || 'general-chika'}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {currentChannelObj?.description || 'The main lounge for daily banter & friendly chika'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Search messages in chat */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 w-36 sm:w-48"
              />
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/20 to-white">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center text-2xl mb-2">
                  💬
                </div>
                <h4 className="font-bold text-slate-700 text-sm">No messages yet in this room</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Say hi, introduce yourself, or share what you’re currently up to!
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = currentUser && msg.senderId === currentUser.id;
                const isMsgOwner = msg.senderRole === 'owner';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full bg-pink-100 object-cover ring-1 ring-pink-200 shrink-0 mt-0.5"
                    />

                    <div className={`max-w-[78%] sm:max-w-[65%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                      {/* Name & Time */}
                      <div className={`flex items-center gap-1.5 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-bold text-slate-800">{msg.senderName}</span>
                        {isMsgOwner && (
                          <span className="text-[9px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                            <span>Owner</span>
                          </span>
                        )}
                        <span className="text-slate-400 text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Reply Quoted Preview */}
                      {msg.replyTo && (
                        <div
                          className={`text-[11px] p-2 rounded-xl border border-pink-100/60 bg-pink-50/70 text-slate-600 flex items-center gap-1.5 ${
                            isMe ? 'rounded-br-xs' : 'rounded-bl-xs'
                          }`}
                        >
                          <Reply className="w-3 h-3 text-pink-400 shrink-0" />
                          <span className="font-bold text-pink-600 truncate">{msg.replyTo.senderName}:</span>
                          <span className="truncate italic">{msg.replyTo.content}</span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed relative ${
                          isMe
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white border border-pink-100/80 text-slate-800 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Hover reply button */}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className={`absolute -bottom-2 ${
                            isMe ? '-left-6' : '-right-6'
                          } opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 hover:text-pink-600 transition-opacity cursor-pointer`}
                          title="Reply to message"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-pink-600 font-semibold italic animate-pulse">
                <span>💬</span>
                <span>{typingUsers.join(', ')} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Quote Banner if replying */}
          {replyingTo && (
            <div className="px-4 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-pink-500" />
                <span>Replying to <strong className="text-pink-600">{replyingTo.senderName}</strong>:</span>
                <span className="truncate italic">"{replyingTo.content}"</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="p-3 bg-white border-t border-pink-100 flex flex-wrap gap-2 animate-fadeIn shadow-xs">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-pink-100 text-lg flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-pink-100/80 bg-white flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showEmojiPicker ? 'bg-pink-100 text-pink-600' : 'text-slate-400 hover:text-pink-500 hover:bg-pink-50'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={
                isAuthenticated
                  ? `Send a message in ${isDirectMessage ? selectedDmUser?.displayName : '#' + (currentChannelObj?.name || 'chat')}...`
                  : 'Log in to join the conversation...'
              }
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-200 outline-none text-xs sm:text-sm font-medium transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-md shadow-pink-200 hover:from-pink-600 hover:to-purple-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
