"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DensityMode = "comfortable" | "compact";
export type ThemeMode = "light" | "dark" | "system";
export type SiteLocale = "en" | "ru";

type PreferencesState = {
  theme: ThemeMode;
  density: DensityMode;
  locale: SiteLocale;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
  setLocale: (locale: SiteLocale) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      density: "comfortable",
      locale: "en",
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "maison-preferences",
    }
  )
);
