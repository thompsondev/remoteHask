import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { OrganizationSummary } from '@/lib/api/auth.api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  organizations: OrganizationSummary[];
  currentOrganizationId: string | null;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  setSession: (payload: {
    accessToken: string;
    user: AuthUser;
    organizations: OrganizationSummary[];
    currentOrganizationId?: string | null;
  }) => void;
  setAccessToken: (token: string | null) => void;
  setCurrentOrganizationId: (organizationId: string) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      organizations: [],
      currentOrganizationId: null,
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      setSession: ({ accessToken, user, organizations, currentOrganizationId }) =>
        set({
          accessToken,
          user,
          organizations,
          currentOrganizationId: currentOrganizationId ?? organizations[0]?.id ?? null,
        }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setCurrentOrganizationId: (currentOrganizationId) => set({ currentOrganizationId }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          organizations: [],
          currentOrganizationId: null,
        }),
      isAuthenticated: () => Boolean(get().accessToken && get().user),
    }),
    {
      name: 'remotehask-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        organizations: state.organizations,
        currentOrganizationId: state.currentOrganizationId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
