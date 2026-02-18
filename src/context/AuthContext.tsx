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
  LoginCredentials,
  AuthResponse,
  AuthContextType,
} from "../types/auth";

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

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data.accessToken || data.token || null;
    } catch (err) {
      return null;
    }
  }, [API_BASE]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      // 1. Показываем лоадер почти всегда при первой загрузке
      setAuth((prev) => ({ ...prev, isLoading: true }));

      try {
        // Пытаемся обновить токен БЕЗ проверки isAuthenticated / accessToken
        // Если http-only refresh cookie есть → сервер вернёт новый access token
        const newToken = await refreshToken();

        if (!newToken) {
          // Нет refresh-токена (или он недействителен) → не авторизован
          throw new Error("No valid session");
        }

        // 2. Получаем данные пользователя с новым токеном
        const res = await fetch(`${API_BASE}/protected/me`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Cannot fetch user");
        }

        const userData = await res.json();

        if (isMounted) {
          setAuth({
            user: userData,
            accessToken: newToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.debug("Session restore failed:", err);
        if (isMounted) {
          setAuth({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

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
        const err = await response
          .json()
          .catch(() => ({ message: "Ошибка входа" }));
        throw new Error(err.message || "Ошибка входа");
      }

      const data: AuthResponse = await response.json();
      const accessToken = data.accessToken || data.token;

      setAuth({
        user: data.user,
        accessToken: accessToken,
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

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuth({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
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
