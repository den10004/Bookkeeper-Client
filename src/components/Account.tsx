import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) return <div>Загрузка...</div>;

  return (
    <div className="account__block">
      <ul style={{ display: "grid", gap: "0" }}>
        <li>
          <strong>Email:</strong> {auth.user?.email}
        </li>
        <li>
          <strong>ID:</strong> {auth.user?.id}
        </li>
        <li>
          <strong>Username:</strong> {auth.user?.username}
        </li>
        <li>
          <strong>Role:</strong> {auth.user?.role}
        </li>
      </ul>

      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
      >
        Выйти
      </button>
    </div>
  );
}
