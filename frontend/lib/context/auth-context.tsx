'use client';

import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types/database';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

export type UserRole = AppRole;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  grade?: number;
  email: string;
  studyStreak: number;
  lastLoginDate: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
