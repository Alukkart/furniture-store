"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminUser = {
  email: string;
  name: string;
  role: "Administrator" | "Manager";
};

// Hardcoded demo credentials — in production these would be server-validated
const ADMIN_ACCOUNTS: Array<AdminUser & { password: string }> = [
  { email: "admin@maison.co", password: "admin123", name: "Admin", role: "Administrator" },
  { email: "manager@maison.co", password: "manager123", name: "Manager", role: "Manager" },
];

type AuthState = {
  currentUser: AdminUser | null;
  loginError: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      loginError: null,

      login: (email, password) => {
        const account = ADMIN_ACCOUNTS.find(
          (a) => a.email === email && a.password === password
        );
        if (account) {
          const { password: _pw, ...user } = account;
          set({ currentUser: user, loginError: null });
          return true;
        }
        set({ loginError: "Invalid email or password." });
        return false;
      },

      logout: () => set({ currentUser: null, loginError: null }),
    }),
    {
      name: "maison-auth",
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
