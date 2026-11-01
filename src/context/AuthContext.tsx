import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, RegistrationRequest, RegistrationStatus } from '../types';
import { StorageService, subscribeToRealtimeChanges } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  pendingRequest: RegistrationRequest | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  isOwner: boolean;
  isAdminOrOwner: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string; status?: RegistrationStatus }>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    interests?: string[];
  }) => Promise<{ success: boolean; message: string; requiresApproval: boolean }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  claimOwnerAccess: (passcode: string) => boolean;
  activeOnlineCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'chika_active_session_user_id';
const PENDING_EMAIL_KEY = 'chika_pending_applicant_email';
const OWNER_EMAIL = 'yslyn26@gmail.com';
const OWNER_MASTER_PASS = 'chika2026';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingRequest, setPendingRequest] = useState<RegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    const savedUserId = localStorage.getItem(SESSION_KEY);
    const pendingEmail = localStorage.getItem(PENDING_EMAIL_KEY);

    if (savedUserId) {
      const user = StorageService.getUserById(savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    } else if (pendingEmail) {
      const req = StorageService.getRegistrationRequests().find(
        (r) => r.email.toLowerCase() === pendingEmail.toLowerCase()
      );
      if (req) {
        if (req.status === 'approved') {
          // If approved while away, log them in!
          const user = StorageService.getUserById(req.id);
          if (user) {
            setCurrentUser(user);
            localStorage.setItem(SESSION_KEY, user.id);
            localStorage.removeItem(PENDING_EMAIL_KEY);
          }
        } else {
          setPendingRequest(req);
        }
      }
    }
    setLoading(false);
  }, []);

  // Listen to realtime approvals or updates
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges((type, payload) => {
      if (type === 'REGISTRATION_APPROVED') {
        const approvedUserId = payload?.userId;
        const currentPendingEmail = localStorage.getItem(PENDING_EMAIL_KEY);

        if (pendingRequest && (pendingRequest.id === approvedUserId || (currentPendingEmail && pendingRequest.email.toLowerCase() === currentPendingEmail.toLowerCase()))) {
          const user = StorageService.getUserById(approvedUserId);
          if (user) {
            setCurrentUser(user);
            setPendingRequest(null);
            localStorage.setItem(SESSION_KEY, user.id);
            localStorage.removeItem(PENDING_EMAIL_KEY);
          }
        }
      } else if (type === 'USERS_UPDATED' && currentUser) {
        const refreshed = StorageService.getUserById(currentUser.id);
        if (refreshed) {
          setCurrentUser(refreshed);
        }
      }
    });

    return unsubscribe;
  }, [currentUser, pendingRequest]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string; status?: RegistrationStatus }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if this is the owner email
    if (cleanEmail === OWNER_EMAIL || (password && password === OWNER_MASTER_PASS)) {
      let ownerUser = StorageService.getUserByEmail(cleanEmail);
      if (!ownerUser) {
        // Create initial owner profile
        ownerUser = {
          id: 'owner-' + Date.now(),
          email: cleanEmail,
          username: 'chika_owner',
          displayName: 'Club Owner 👑',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=chika_owner&backgroundColor=ffdfba',
          bio: 'Founder & Owner of Chika Club. Keeping our lounge safe, cozy, and fun! ✨',
          interests: ['Community Love', 'Tea Spilling', 'Arcade Fun'],
          role: 'owner',
          status: 'approved',
          xp: 1500,
          level: 10,
          rankTitle: 'Tea Spiller VIP',
          streakDays: 15,
          lastActive: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
          badges: ['Founder 👑', 'Community Guardian', 'Legendary Bestie'],
        };
        StorageService.saveUser(ownerUser);
      } else if (ownerUser.role !== 'owner') {
        ownerUser.role = 'owner';
        ownerUser.status = 'approved';
        StorageService.saveUser(ownerUser);
      }
      setCurrentUser(ownerUser);
      setPendingRequest(null);
      localStorage.setItem(SESSION_KEY, ownerUser.id);
      localStorage.removeItem(PENDING_EMAIL_KEY);
      return { success: true, status: 'approved' };
    }

    // Check existing approved users
    const user = StorageService.getUserByEmail(cleanEmail);
    if (user) {
      if (user.status === 'approved') {
        setCurrentUser(user);
        setPendingRequest(null);
        localStorage.setItem(SESSION_KEY, user.id);
        localStorage.removeItem(PENDING_EMAIL_KEY);
        return { success: true, status: 'approved' };
      } else if (user.status === 'rejected') {
        return { success: false, message: 'Your application was declined by the owner.', status: 'rejected' };
      } else {
        // Pending
        const req = StorageService.getRegistrationRequests().find((r) => r.email.toLowerCase() === cleanEmail);
        if (req) {
          setPendingRequest(req);
          localStorage.setItem(PENDING_EMAIL_KEY, req.email);
        }
        return { success: false, message: 'Your registration is awaiting owner approval.', status: 'pending' };
      }
    }

    // Check registration requests
    const pending = StorageService.getRegistrationRequests().find((r) => r.email.toLowerCase() === cleanEmail);
    if (pending) {
      if (pending.status === 'pending') {
        setPendingRequest(pending);
        localStorage.setItem(PENDING_EMAIL_KEY, pending.email);
        return { success: false, message: 'Your registration is awaiting owner approval.', status: 'pending' };
      } else if (pending.status === 'rejected') {
        return { success: false, message: 'Your registration request was declined.', status: 'rejected' };
      }
    }

    return { success: false, message: 'No registered account found with this email. Please register first!' };
  };

  const register = async (data: {
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    interests?: string[];
  }): Promise<{ success: boolean; message: string; requiresApproval: boolean }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim().replace('@', '');

    // Check if email or username is already taken
    const existingUsers = StorageService.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists.', requiresApproval: false };
    }
    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: 'Username is already taken by another member.', requiresApproval: false };
    }

    const existingReqs = StorageService.getRegistrationRequests();
    if (existingReqs.some((r) => r.email.toLowerCase() === cleanEmail && r.status === 'pending')) {
      return { success: false, message: 'You already submitted a registration request with this email. Awaiting approval!', requiresApproval: true };
    }

    const newId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // If it's the owner email, approve automatically
    if (cleanEmail === OWNER_EMAIL) {
      const ownerUser: User = {
        id: newId,
        email: cleanEmail,
        username: cleanUsername,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + cleanUsername,
        bio: data.bio || 'Club Owner',
        interests: data.interests || ['Chika', 'Community'],
        role: 'owner',
        status: 'approved',
        xp: 1500,
        level: 10,
        rankTitle: 'Tea Spiller VIP',
        streakDays: 1,
        lastActive: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        badges: ['Founder 👑', 'Welcome Bestie'],
      };
      StorageService.saveUser(ownerUser);
      setCurrentUser(ownerUser);
      localStorage.setItem(SESSION_KEY, ownerUser.id);
      return { success: true, message: 'Owner account registered & activated!', requiresApproval: false };
    }

    // Normal user registration requires owner approval!
    const req: RegistrationRequest = {
      id: newId,
      email: cleanEmail,
      username: cleanUsername,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfba`,
      bio: data.bio || 'Excited to join Chika Club!',
      interests: data.interests || ['Chika', 'Fun', 'Hangout'],
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    StorageService.addRegistrationRequest(req);
    setPendingRequest(req);
    localStorage.setItem(PENDING_EMAIL_KEY, req.email);

    return {
      success: true,
      message: 'Registration request submitted! The club owner has been notified and will review your application soon.',
      requiresApproval: true,
    };
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingRequest(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PENDING_EMAIL_KEY);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = StorageService.updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const claimOwnerAccess = (passcode: string): boolean => {
    if (passcode.trim() === OWNER_MASTER_PASS) {
      if (currentUser) {
        const updated = StorageService.updateUser(currentUser.id, { role: 'owner', status: 'approved' });
        if (updated) setCurrentUser(updated);
      } else {
        // Log in as default owner
        login(OWNER_EMAIL, OWNER_MASTER_PASS);
      }
      return true;
    }
    return false;
  };

  // Real approved users count
  const approvedUsers = StorageService.getUsers().filter((u) => u.status === 'approved');
  const activeOnlineCount = Math.max(1, approvedUsers.length);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        pendingRequest,
        isAuthenticated: Boolean(currentUser && currentUser.status === 'approved'),
        isApproved: Boolean(currentUser && currentUser.status === 'approved'),
        isOwner: Boolean(currentUser && (currentUser.role === 'owner' || currentUser.email.toLowerCase() === OWNER_EMAIL)),
        isAdminOrOwner: Boolean(currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin' || currentUser.email.toLowerCase() === OWNER_EMAIL)),
        login,
        register,
        logout,
        updateProfile,
        claimOwnerAccess,
        activeOnlineCount,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
