import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  bio: string;
  balance: number;
  xp: number;
  level: number;
  streak: number;
  lives: number;
  coins: number;
  tier: string;
  unlockedColors: string[];
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  openAuthModal: () => void;
  logout: () => Promise<void>;
  // kept for backward compat — no-ops with Clerk
  forceModal: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: localUser, isLoading: userLoading } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), enabled: isSignedIn === true },
  });
  const { signOut, openSignIn } = useClerk();
  const queryClient = useQueryClient();

  const user = (isSignedIn && localUser ? localUser : null) as AuthUser | null;
  const isLoading = !isLoaded || (isSignedIn === true && userLoading && !localUser);

  const openAuthModal = () => openSignIn();

  const logout = async () => {
    await signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      openAuthModal,
      logout,
      forceModal: false,
      login: async () => {},
      register: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Kept for backward compat — no longer used
export function isWithinLogoutGrace() { return false; }
export function isWithinGuestGrace() { return true; }
export const GUEST_TS_KEY = 'spike_guest_ts';
