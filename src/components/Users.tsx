import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import { api } from "../services/api";
import { errorDictionary, roles } from "../constants";
import CreateUserForm from "./CreateUser";

export default function Users() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
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
      fetchUsers();
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

  const handleSave = async (userId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!auth.accessToken) return;
    const confirmMessage =
      "Вы уверены, что хотите сохранить изменения для пользователя";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const originalUser = accountants.find((u) => u.id === Number(userId));

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
    } catch (err: any) {
      const errorText = err?.message;
      const userMessage = errorDictionary[errorText] || errorText;
      alert(userMessage);
      setError(userMessage);

      if (originalUser) {
        setEditForm({
          username: originalUser.username,
          email: originalUser.email,
          role: originalUser.role,
        });
      }
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
    const previousAccountants = [...accountants];

    try {
      await api.deleteUser(auth.accessToken, userId);
      setAccountants(accountants.filter((user) => user.id !== Number(userId)));
      setError(null);
    } catch (err: any) {
      const errorText = err?.message;
      const userMessage = errorDictionary[errorText] || errorText;
      alert(userMessage);
      console.error("Ошибка удаления:", userMessage);
      setError(userMessage);
      setAccountants(previousAccountants);
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setError(null);
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setError(null);
  };

  const handleCreateUser = async (userData: {
    username: string;
    email: string;
    role: string;
    password: string;
  }) => {
    if (!auth.accessToken) return;

    try {
      const createdUser = await api.createUser(auth.accessToken, userData);
      const completeUser: User = {
        id: createdUser.id,
        username: createdUser.username || userData.username,
        email: createdUser.email || userData.email,
        role: createdUser.role || userData.role,
      };

      setAccountants([...accountants, completeUser]);
      setIsCreating(false);
      setError(null);
    } catch (err: any) {
      const errorText = err?.message;
      const userMessage = errorDictionary[errorText] || errorText;
      alert(userMessage);
      setError("Не удалось создать пользователя");
      throw err; // Пробрасываем ошибку для компонента формы
    }
  };

  const renderUserField = (user: User, field: keyof User) => {
    if (editingId === user.id) {
      if (field === "role") {
        return (
          <select
            value={(editForm[field] as string) || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="edit-input"
            required
          >
            {Object.entries(roles).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          type={field === "email" ? "email" : "text"}
          value={(editForm[field] as string) || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
          required
          minLength={field === "username" ? 2 : undefined}
        />
      );
    }

    if (field === "role") {
      return <span>{roles[user.role as keyof typeof roles] || user.role}</span>;
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
          {loadingAccountants && <p>Загрузка</p>}

          {error && <p className="error">{error}</p>}

          <div className="users__list">
            <div className="users__header">
              <h3>Список пользователей</h3>
              <button onClick={handleCreateClick}>Создать пользователя</button>
            </div>

            {isCreating && (
              <CreateUserForm
                onSubmit={handleCreateUser}
                onCancel={handleCreateCancel}
              />
            )}

            <ul className="user__form-header">
              <li>
                <strong>Имя</strong>
              </li>
              <li>
                <strong>E-mail</strong>
              </li>
              <li>
                <strong>Должность</strong>
              </li>
              <li>
                <strong>Действия</strong>
              </li>
            </ul>

            {accountants.map((accountant) => (
              <div key={accountant.id}>
                {editingId === accountant.id ? (
                  <form onSubmit={(e) => handleSave(String(accountant.id), e)}>
                    <ul className="user__form-data">
                      <li>
                        <input
                          type="text"
                          pattern="[A-Za-zА-Яа-яЁё\s]+"
                          title="Используйте только буквы и пробелы"
                          value={editForm.username || ""}
                          onChange={(e) =>
                            handleInputChange("username", e.target.value)
                          }
                          className="edit-input"
                          required
                          minLength={2}
                        />
                      </li>
                      <li>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          required
                        />
                      </li>
                      <li>
                        <input
                          type="password"
                          value={editForm.password || ""}
                          placeholder="Пароль текущий или новый"
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          required
                        />
                      </li>
                      <li>
                        <select
                          value={editForm.role || ""}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="edit-input"
                          required
                        >
                          {Object.entries(roles).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </li>
                      <li
                        className="actions"
                        style={{ display: "flex", gap: "5px" }}
                      >
                        <button
                          type="submit"
                          style={{ background: "var(--green)" }}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          style={{ background: "var(--blue)" }}
                        >
                          Отмена
                        </button>
                      </li>
                    </ul>
                  </form>
                ) : (
                  <ul className="user__form-data">
                    <li>{renderUserField(accountant, "username")}</li>
                    <li>{renderUserField(accountant, "email")}</li>
                    <li>{renderUserField(accountant, "role")}</li>
                    <li className="actions">
                      <button
                        onClick={() => handleEdit(accountant)}
                        style={{ background: "var(--green)" }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(String(accountant.id))}
                        style={{ background: "var(--red)" }}
                      >
                        Удалить
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ))}

            {accountants.length === 0 && !loadingAccountants && (
              <p>Нет пользователей для отображения</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
