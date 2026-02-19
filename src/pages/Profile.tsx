import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Application } from "../types/auth";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Applications from "../components/Applications";
import AddApplication from "../components/AddApplication";

import Users from "../components/Users";

export default function Profile() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  const fetchApplications = async () => {
    if (!auth.accessToken) return;

    try {
      setLoadingApps(true);
      setAppsError(null);
      const data = await api.getApplications(auth.accessToken);
      setApplications(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ошибка при загрузке заявок";
      setAppsError(msg);
      console.error("Error fetching applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated || !auth.accessToken) {
      navigate("/", { replace: true });
      return;
    }

    fetchApplications();
  }, [auth.isAuthenticated, auth.isLoading, auth.accessToken, navigate]);

  const addApplicationOptimistic = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplicationOptimistic = (
    updatedFields: Partial<Application> & { id: string },
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedFields.id ? { ...app, ...updatedFields } : app,
      ),
    );
  };

  const refreshApplications = () => {
    fetchApplications();
  };

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
          <div>
            <strong>Email:</strong> {auth.user?.email}
          </div>
          <div>
            <strong>ID:</strong> {auth.user?.id}
          </div>
          <div>
            <strong>Username:</strong> {auth.user?.username}
          </div>
          <div>
            <strong>Role:</strong> {auth.user?.role}
          </div>
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

      {auth.user?.role === "manager" && (
        <AddApplication
          onApplicationAdded={addApplicationOptimistic}
          onApplicationsUpdate={refreshApplications}
        />
      )}

      <Applications
        loadingApps={loadingApps}
        appsError={appsError}
        applications={applications}
        onApplicationUpdated={updateApplicationOptimistic}
        onApplicationsUpdate={refreshApplications}
      />

      {auth.user?.role === "director" && <Users />}
    </div>
  );
}
