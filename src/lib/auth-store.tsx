import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "informatica:session";
const ADMIN_EMAIL = "francdenisbr@gmail.com";
const ADMIN_PASSWORD = "125758";

interface AuthState {
  isAuthenticated: boolean;
  isReady: boolean;
  email: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === ADMIN_EMAIL) setEmail(stored);
    } finally {
      setIsReady(true);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: email !== null,
      isReady,
      email,
      login: (inputEmail, password) => {
        const normalized = inputEmail.trim().toLowerCase();
        if (normalized === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          window.localStorage.setItem(STORAGE_KEY, ADMIN_EMAIL);
          setEmail(ADMIN_EMAIL);
          return true;
        }
        return false;
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setEmail(null);
      },
    }),
    [email, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
