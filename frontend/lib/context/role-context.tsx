'use client';

import { createContext, useContext } from 'react';

export type Role = 'admin' | 'teacher' | 'student';

export interface RoleContextType {
  role: Role | null;
  colors: Record<string, string>;
}

// A safe default so consumers outside the provider still get a stable value
export const RoleContext = createContext<RoleContextType>({
  role: null,
  colors: {},
});

export function useRole(): RoleContextType {
  return useContext(RoleContext);
}
