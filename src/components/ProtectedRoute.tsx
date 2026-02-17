// ProtectedRoute.tsx — немного меняем логику
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }
  if (!isAuthenticated) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Сессия завершена</h2>
        <p>Вы вышли из аккаунта.</p>
        <button
          onClick={() => (window.location.href = "/login")}
          style={{
            padding: "10px 20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginTop: "1rem",
          }}
        >
          Войти снова
        </button>
      </div>
    );
  }

  return children;
}
