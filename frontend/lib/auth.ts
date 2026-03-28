"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser, RoleName } from "./types";
import { login as loginRequest } from "@/services/auth";
import { getApiErrorMessage } from "@/services/http";

export type { AdminUser };

type AuthState = {
  currentUser: AdminUser | null;
  token: string | null;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAnyRole: (roles: RoleName[]) => boolean;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      loginError: null,

      login: async (email, password) => {
        try {
          const result = await loginRequest(email, password);
          set({ currentUser: result.user, token: result.token, loginError: null });
          return true;
        } catch (error) {
          set({
            loginError: getApiErrorMessage(error, "Invalid email or password."),
          });
          return false;
        }
      },

      logout: () => set({ currentUser: null, token: null, loginError: null }),

      hasAnyRole: (roles) => {
        const role = get().currentUser?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    {
      name: "maison-auth",
      partialize: (state) => ({ currentUser: state.currentUser, token: state.token }),
    }
  )
);
