import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "informatica:theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Aplica e persiste o tema claro/escuro. O flash na primeira pintura é
 * evitado por um script inline no `<head>` (ver `__root.tsx`) que já aplica
 * a classe `dark` antes do React hidratar — este provider só assume o
 * controle depois disso, mantendo os dois em sincronia.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
