import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { auth } = useAuth();

  if (auth.isLoading) {
    return <div>Проверка авторизации...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
