import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import { api } from "../services/api";

export default function Users() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = async () => {
    if (!auth.accessToken) return;

    setLoadingAccountants(true);
    setError(null);
    try {
      const data = await api.fetchUsers(auth.accessToken);
      setAccountants(data);
    } catch (err) {
      console.error("Ошибка загрузки бухгалтеров:", err);
      setError("Не удалось загрузить список бухгалтеров");
    } finally {
      setLoadingAccountants(false);
    }
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && accountants.length === 0) {
      users();
    }
  };

  return (
    <div className="users">
      <button onClick={handleButtonClick}>
        {isOpen ? "закрыть" : "открыть"}
      </button>

      {isOpen && (
        <div className="menu">
          {loadingAccountants && <p>Загрузка...</p>}
          {error && <p className="error">{error}</p>}
          {!loadingAccountants && !error && (
            <div>
              {accountants.map((accountant) => (
                <ul key={accountant.id}>
                  <li>{accountant.username}</li>
                  <li>{accountant.email}</li>
                  <li>{accountant.role}</li>
                </ul>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
