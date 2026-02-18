import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import Applications from "../components/Applications";

interface Application {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export default function Profile() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated || !auth.accessToken) {
      navigate("/", { replace: true });
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoadingApps(true);
        setAppsError(null);
        const data = await api.getApplications(auth.accessToken!);
        setApplications(data);
      } catch (err) {
        setAppsError(
          err instanceof Error ? err.message : "Ошибка при загрузке заявок",
        );
        console.error("Error fetching applications:", err);
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApplications();
  }, [auth.isAuthenticated, auth.isLoading, auth.accessToken, navigate]);

  if (auth.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        Проверка авторизации...
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Профиль пользователя</h1>

        <div style={{ display: "grid", gap: "0" }}>
          <p>
            <strong>Email:</strong> {auth.user?.email}
          </p>
          <p>
            <strong>ID:</strong> {auth.user?.id}
          </p>
          <p>
            <strong>Username:</strong> {auth.user?.username}
          </p>
          <p>
            <strong>Role:</strong> {auth.user?.role}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Выйти
        </button>
      </div>

      <Applications
        loadingApps={loadingApps}
        setLoadingApps={setLoadingApps}
        appsError={appsError}
        applications={applications}
      />
    </div>
  );
}
