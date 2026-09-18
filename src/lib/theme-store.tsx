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
 *
 * Importante: o estado começa sempre em "light" (igual nos dois lados), e só
 * lê o valor real (localStorage/preferência do sistema) depois de montado.
 * Ler isso direto no useState fazia a 1ª renderização do cliente já sair
 * diferente do HTML vindo do servidor — erro de hidratação.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sincronizado, setSincronizado] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme() ?? getSystemTheme());
    setSincronizado(true);
  }, []);

  useEffect(() => {
    if (!sincronizado) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, sincronizado]);

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
