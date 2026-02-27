"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function StoreBootstrap() {
  const bootstrap = useStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}
