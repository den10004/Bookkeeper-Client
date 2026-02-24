import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roles } from "../constants";

export default function Account() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const roleDisplay =
    (auth.user?.role && roles[auth.user.role as keyof typeof roles]) ??
    "Не указана";

  if (auth.isLoading) return <div>Загрузка...</div>;

  return (
    <div className="account__block">
      <ul>
        <li>
          <strong>Email:</strong> {auth.user?.email}
        </li>
        <li>
          <strong>Имя:</strong> {auth.user?.username}
        </li>
        <li>
          <strong>Роль:</strong> {roleDisplay}
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
