"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "./types";
import { login as loginRequest } from "@/services/auth";
import { getApiErrorMessage } from "@/services/http";

export type { AdminUser };

type AuthState = {
  currentUser: AdminUser | null;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      loginError: null,

      login: async (email, password) => {
        try {
          const user = await loginRequest(email, password);
          set({ currentUser: user, loginError: null });
          return true;
        } catch (error) {
          set({
            loginError: getApiErrorMessage(error, "Invalid email or password."),
          });
          return false;
        }
      },

      logout: () => set({ currentUser: null, loginError: null }),
    }),
    {
      name: "maison-auth",
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
