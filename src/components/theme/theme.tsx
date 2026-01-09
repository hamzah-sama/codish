"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";

import { Hint } from "@/components/hint";

const Theme = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Hint
      text={theme === "dark" ? "Switch to light Mode" : "Switch to dark Mode"}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </motion.div>
        </AnimatePresence>
      </Button>
    </Hint>
  );
};

export default Theme;