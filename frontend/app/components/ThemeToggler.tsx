// components/ThemeToggle.tsx
"use client";
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };
  
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-primary rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-2 left-2 h-5 w-5 text-primary rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export default ThemeToggle;