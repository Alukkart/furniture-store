"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePreferences } from "@/lib/preferences";

export default function UISettingsSync() {
  const theme = usePreferences((s) => s.theme);
  const density = usePreferences((s) => s.density);
  const locale = usePreferences((s) => s.locale);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  useEffect(() => {
    document.body.dataset.density = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
