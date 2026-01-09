"use client";

import dynamic from "next/dynamic";

export const ThemeToggle = dynamic(() => import("@/components/theme/theme"), {
  ssr: false,
});