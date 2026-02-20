import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import { api } from "../services/api";
import { roles } from "../constants";

export default function Users() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const [loadingUsersList, setLoadingUsersList] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  console.log(roles);

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

  const fetchAccountants = async () => {
    if (!auth.accessToken) return;

    setLoadingAccountants(true);
    setError(null);

    try {
      const data = await api.getUsersByRole("accountant", auth.accessToken);
      setUsersList(data);
      console.log(loadingUsersList);
    } catch (err) {
      console.error("Ошибка загрузки бухгалтеров:", err);
      setError("Не удалось загрузить список бухгалтеров");
    } finally {
      setLoadingUsersList(false);
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
    const confirmMessage =
      "Вы уверены, что хотите сохранить изменения для пользователя";

    if (!window.confirm(confirmMessage)) {
      return;
    }
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

  const handleDelete = async (userId: string) => {
    if (!auth.accessToken) return;
    const confirmMessage = "Вы уверены, что хотите удалить пользователя";

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await api.deleteUser(auth.accessToken, userId);
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
              <div>
                <h3>Список пользователей</h3>
                <button>Создать пользователя</button>
              </div>
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
                    <button
                      onClick={() => handleDelete(String(accountant.id))}
                      style={{ background: "var(--red)" }}
                    >
                      Удалить
                    </button>
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
