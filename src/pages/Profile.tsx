import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
      >
        Проверка авторизации...
      </div>
    );
  }
  if (!auth.isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  if (auth.isLoading) return <div>Загрузка...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <h1>Профиль</h1>
      <p>
        <strong>Email:</strong> {auth.user?.email}
      </p>
      <p>
        <strong>ID:</strong> {auth.user?.id}
      </p>
      <p>
        <strong>username:</strong> {auth.user?.username}
      </p>
      <p>
        <strong>role:</strong> {auth.user?.role}
      </p>

      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
        style={{ marginTop: "32px", padding: "12px 24px" }}
      >
        Выйти
      </button>
    </div>
  );
}
