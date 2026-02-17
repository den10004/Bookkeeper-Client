import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { AuthState, User, LoginCredentials, AuthResponse } from "../types/auth";

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    accessToken: null, // теперь только в памяти
    isLoading: true,
    error: null,
  });

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("http://localhost:3000/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("[Refresh] статус не 2xx:", res.status);
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.accessToken || data.token;

      if (!newAccessToken) {
        console.warn("[Refresh] нет accessToken в ответе");
        return null;
      }

      setAuth((prev) => ({
        ...prev,
        accessToken: newAccessToken,
        isAuthenticated: true,
      }));

      return newAccessToken;
    } catch (err) {
      console.error("[Refresh] исключение:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      setAuth((prev) => ({ ...prev, isLoading: true }));

      try {
        let response = await fetch("http://localhost:3000/protected/me", {
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          console.log("[Auth] Получен 401/403 → запускаем refresh");

          const newToken = await refreshToken();

          if (!newToken) {
            throw new Error("Не удалось обновить access token");
          }

          response = await fetch("http://localhost:3000/protected/me", {
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
          accessToken: auth.accessToken || null, // может быть обновлён в refreshToken
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
      const response = await fetch("http://localhost:3000/auth/login", {
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
    fetch("http://localhost:3000/auth/logout", {
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
