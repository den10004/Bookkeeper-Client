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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const users = async () => {
    if (!auth.accessToken) return;

    setLoadingAccountants(true);
    setError(null);
    try {
      const data = await api.fetchUsers(auth.accessToken);
      setAccountants(data);
    } catch (err) {
      console.error("Ошибка загрузки пользователей:", err);
      setError("Не удалось загрузить список пользователей");
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

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (userId: string) => {
    if (!auth.accessToken) return;

    try {
      await api.changeUsers(auth.accessToken, userId, editForm);
      setAccountants(
        accountants.map((user) =>
          user.id === Number(userId) ? { ...user, ...editForm } : user,
        ),
      );

      setEditingId(null);
      setEditForm({});
      setError(null);
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      setError("Не удалось сохранить изменения");
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderUserField = (user: User, field: keyof User) => {
    if (editingId === user.id) {
      return (
        <input
          type="text"
          value={(editForm[field] as string) || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
        />
      );
    }
    return <span>{user[field]}</span>;
  };

  return (
    <div className="users">
      <button onClick={handleButtonClick}>
        {isOpen
          ? "закрыть список пользователей"
          : "открыть список пользователей"}
      </button>

      {isOpen && (
        <div className="users__block">
          {loadingAccountants && <p>Загрузка...</p>}
          {error && <p className="error">{error}</p>}
          {!loadingAccountants && !error && (
            <div className="users__list">
              <h3>Список пользователей</h3>

              <ul>
                <li>
                  <strong>Имя</strong>
                </li>
                <li>
                  <strong>E-mail</strong>
                </li>
                <li>
                  <strong>Должность</strong>
                </li>
                <li></li>
              </ul>
              {accountants.map((accountant) => (
                <ul
                  key={accountant.id}
                  className={editingId === accountant.id ? "editing" : ""}
                >
                  <li>{renderUserField(accountant, "username")}</li>
                  <li>{renderUserField(accountant, "email")}</li>
                  <li>{accountant.role}</li>
                  <li className="actions">
                    {editingId === accountant.id ? (
                      <>
                        <button
                          onClick={() => handleSave(String(accountant.id))}
                          style={{ background: "var(--red)" }}
                        >
                          Сохранить
                        </button>
                        <button onClick={handleCancel}>Отмена</button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(accountant)}>
                        Редактировать
                      </button>
                    )}
                  </li>
                </ul>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
