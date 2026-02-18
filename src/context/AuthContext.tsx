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
  console.log(auth.user);
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        console.log("Refresh token expired or invalid");
        return null;
      }

      if (!res.ok) {
        console.log("Refresh failed with status:", res.status);
        return null;
      }

      const data = await res.json();
      console.log("Refresh response:", data);

      return data.accessToken || data.token || null;
    } catch (err) {
      console.error("Refresh token error:", err);
      return null;
    }
  }, [API_BASE]);

  const fetchUserData = useCallback(
    async (token: string): Promise<User | null> => {
      try {
        const response = await fetch(`${API_BASE}/protected/me`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.log("Failed to fetch user data:", response.status);
          return null;
        }

        const userData: User = await response.json();
        return userData;
      } catch (err) {
        console.error("Fetch user data error:", err);
        return null;
      }
    },
    [API_BASE],
  );

  useEffect(() => {
    const restoreSession = async () => {
      setAuth((prev) => ({ ...prev, isLoading: true }));

      try {
        const newToken = await refreshToken();

        if (!newToken) {
          console.log("No token received from refresh");
          setAuth({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        const userData = await fetchUserData(newToken);

        if (!userData) {
          console.log("No user data received");
          setAuth({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        setAuth({
          user: userData,
          accessToken: newToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("Session restoration error:", err);
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
  }, [refreshToken, fetchUserData]);

  const login = async (credentials: LoginCredentials) => {
    setAuth((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log("Attempting login...");
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
      console.log("Login response:", data);

      const accessToken = data.accessToken || data.token;

      if (!accessToken) {
        throw new Error("No access token received");
      }

      setAuth({
        user: data.user,
        accessToken: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log("Login successful");
    } catch (err: any) {
      console.error("Login error:", err);
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
    } catch (err) {
      console.error("Logout error:", err);
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
