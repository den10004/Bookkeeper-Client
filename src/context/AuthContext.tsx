import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, User, LoginCredentials, AuthResponse } from "../types/auth";

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    accessToken: "",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      // Здесь обычно делают запрос /me или /profile для получения текущего пользователя
      // Для простоты предположим, что токен валиден
      // В реальном проекте — запрос + обработка 401
      setAuth({
        user: { id: 0, email: "", name: "", username: "", role: "" },
        isAuthenticated: true,
        accessToken: "",
        isLoading: false,
        error: null,
      });
    } else {
      setAuth((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setAuth((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Ошибка входа");
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem(STORAGE_KEY, data.token);

      setAuth({
        user: data.user,
        accessToken: data.accessToken,
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
  const refreshToken = async () => {
    try {
      const res = await fetch("http://localhost:3000/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data = await res.json();
      setAuth((prev) => ({
        ...prev,
        accessToken: data.accessToken,
        isAuthenticated: true,
      }));

      return data.accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  };
  const makeRequest = async (url: string, options: RequestInit = {}) => {
    let token = auth.accessToken;

    // Если нет токена → пробуем обновить
    if (!token) {
      token = await refreshToken();
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      const newToken = await refreshToken();
      headers.Authorization = `Bearer ${newToken}`;

      return fetch(url, { ...options, headers, credentials: "include" });
    }

    return response;
  };
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({
      user: null,
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
