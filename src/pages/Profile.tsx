import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const {
    user,
    logout,
    isAuthenticated,
    isLoading,
    accessToken,
    refreshAccessToken,
  } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const loadProfile = async () => {
      try {
        const res = await fetch("http://localhost:3000/protected/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (res.status === 401) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            const retry = await fetch("http://localhost:3000/protected/me", {
              headers: { Authorization: `Bearer ${accessToken}` },
              credentials: "include",
            });
            if (retry.ok) {
              setProfileData(await retry.json());
              return;
            }
          }
          throw new Error("Не удалось обновить сессию");
        }

        if (!res.ok) throw new Error("Ошибка загрузки профиля");

        setProfileData(await res.json());
      } catch (err: any) {
        setError(err.message);
      }
    };

    loadProfile();
  }, [isAuthenticated, accessToken, refreshAccessToken]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setAccessToken(null);
    setUser(null);
    navigate("/", { replace: true });
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (error) {
    return (
      <div style={{ color: "red", padding: "2rem" }}>
        Ошибка: {error}
        <br />
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <h1>Профиль пользователя</h1>

      {user && (
        <div style={{ marginBottom: "2rem" }}>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          {user.name && (
            <p>
              <strong>Имя:</strong> {user.name}
            </p>
          )}
          <p>
            <strong>ID:</strong> {user.id}
          </p>
        </div>
      )}

      {profileData ? (
        <div>
          <h3>Дополнительные данные</h3>
          <pre
            style={{
              background: "#f4f4f4",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      ) : (
        <p>Загружаем дополнительные данные...</p>
      )}

      <button
        onClick={async () => {
          await logout();
          navigate("/", { replace: true });
        }}
        style={{
          marginTop: "2rem",
          padding: "10px 20px",
          background: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
        }}
      >
        Выйти
      </button>
    </div>
  );
}
