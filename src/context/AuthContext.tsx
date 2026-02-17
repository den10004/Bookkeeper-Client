// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type User = { id: string; email: string; name?: string } | null;

type AuthContextType = {
  user: User;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      let currentToken = accessToken;

      if (!currentToken) {
        currentToken = await refreshAccessToken();
      }

      if (currentToken) {
        try {
          const me = await fetchUserProfile(currentToken);
          setUser(me);
        } catch (err) {
          console.error("Profile load failed even after refresh", err);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const fetchUserProfile = async (token: string): Promise<User> => {
    const res = await fetch("http://localhost:3000/protected/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Profile fetch failed");
    return res.json();
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Ошибка входа");
    }

    const { accessToken, user } = await res.json();

    setAccessToken(accessToken);
    setUser(user);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("http://localhost:3000/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("Refresh failed", res.status);
        return null;
      }

      const { accessToken: newAccessToken } = await res.json();

      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (err) {
      console.error("Refresh error", err);
      return null;
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:3000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Ошибка при вызове /logout:", err);
    }

    setAccessToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    logout,
    login,
    refreshAccessToken,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
