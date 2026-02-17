import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";

import type {
  AuthState,
  User,
  LoginCredentials,
  AuthResponse,
} from "../types/auth";

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    isLoading: true,
    error: null,
  });

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.accessToken || data.token;

      if (!newAccessToken) {
        return null;
      }

      setAuth((prev) => ({
        ...prev,
        accessToken: newAccessToken,
        isAuthenticated: true,
      }));

      return newAccessToken;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      setAuth((prev) => ({ ...prev, isLoading: true }));

      try {
        let response = await fetch(`${API_BASE}/protected/me`, {
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          const newToken = await refreshToken();

          if (!newToken) {
            throw new Error("Не удалось обновить access token");
          }

          response = await fetch(`${API_BASE}/protected/me`, {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          console.error(
            "[Auth] /me всё равно не ok:",
            response.status,
            errText,
          );
          throw new Error(`Сервер ответил ${response.status}`);
        }

        const userData: User = await response.json();

        setAuth({
          user: userData,
          accessToken: auth.accessToken || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.warn("Не удалось восстановить сессию:", err);
        setAuth({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    restoreSession();

    // Можно добавить интервальное обновление токена, если accessToken короткоживущий
    // const interval = setInterval(refreshToken, 5 * 60 * 1000); // каждые 5 мин
    // return () => clearInterval(interval);
  }, [refreshToken]); // зависимость от refreshToken (useCallback)

  const login = async (credentials: LoginCredentials) => {
    setAuth((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Ошибка входа");
      }

      const data: AuthResponse = await response.json();

      setAuth({
        user: data.user,
        accessToken: data.accessToken || data.token || null, // в зависимости от ответа сервера
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setAuth((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Не удалось войти",
      }));
      throw err;
    }
  };

  const logout = () => {
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    setAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
}
