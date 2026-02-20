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
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "manager",
    password: "",
  });

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
      setAccountants(accountants.filter((user) => user.id !== Number(userId)));
      setError(null);
    } catch (err) {
      console.error("Ошибка удаления:", err);
      setError("Не удалось удалить пользователя");
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setNewUser({
      username: "",
      email: "",
      role: "manager",
      password: "",
    });
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewUser({
      username: "",
      email: "",
      role: "manager",
      password: "",
    });
  };

  const handleNewUserChange = (field: string, value: string) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    if (!auth.accessToken) return;

    if (!newUser.username || !newUser.email) {
      setError("Заполните все поля");
      return;
    }

    try {
      const createdUser = await api.createUser(auth.accessToken, newUser);
      const completeUser: User = {
        id: createdUser.id,
        username: createdUser.username || newUser.username,
        email: createdUser.email || newUser.email,
        role: createdUser.role || newUser.role,
      };

      setAccountants([...accountants, completeUser]);
      setIsCreating(false);
      setNewUser({
        username: "",
        email: "",
        role: "manager",
        password: "",
      });
      setError(null);
    } catch (err) {
      console.error("Ошибка создания пользователя:", err);
      setError("Не удалось создать пользователя");
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
          type="text"
          value={(editForm[field] as string) || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
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
          {loadingAccountants && <p>Загрузка...</p>}
          {error && <p className="error">{error}</p>}
          {!loadingAccountants && !error && (
            <div className="users__list">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3>Список пользователей</h3>
                <button onClick={handleCreateClick}>
                  Создать пользователя
                </button>
              </div>

              {/* Форма создания нового пользователя */}
              {isCreating && (
                <div
                  className="create-user-form"
                  style={{
                    background: "#f5f5f5",
                    padding: "15px",
                    marginBottom: "20px",
                    borderRadius: "4px",
                  }}
                >
                  <h4>Новый пользователь</h4>
                  <ul
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <li>
                      <input
                        type="text"
                        placeholder="Имя"
                        value={newUser.username}
                        onChange={(e) =>
                          handleNewUserChange("username", e.target.value)
                        }
                      />
                    </li>
                    <li>
                      <input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) =>
                          handleNewUserChange("email", e.target.value)
                        }
                      />
                    </li>
                    <li>
                      <input
                        type="text"
                        placeholder="password"
                        value={newUser.password}
                        onChange={(e) =>
                          handleNewUserChange("password", e.target.value)
                        }
                      />
                    </li>
                    <li>
                      <select
                        value={newUser.role}
                        onChange={(e) =>
                          handleNewUserChange("role", e.target.value)
                        }
                      >
                        {Object.entries(roles).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </li>
                    <li className="actions">
                      <button
                        onClick={handleCreateUser}
                        style={{ background: "var(--green, #4CAF50)" }}
                      >
                        Сохранить
                      </button>
                      <button onClick={handleCreateCancel}>Отмена</button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Заголовки таблицы */}
              <ul
                style={{
                  display: "flex",
                  listStyle: "none",
                  padding: "10px 0",
                  borderBottom: "2px solid #ddd",
                }}
              >
                <li style={{ flex: 1 }}>
                  <strong>Имя</strong>
                </li>
                <li style={{ flex: 1 }}>
                  <strong>E-mail</strong>
                </li>
                <li style={{ flex: 1 }}>
                  <strong>Должность</strong>
                </li>
                <li style={{ width: "200px" }}>
                  <strong>Действия</strong>
                </li>
              </ul>

              {/* Убедитесь, что у каждого элемента есть уникальный ключ */}
              {accountants.map((accountant) => (
                <ul
                  key={String(accountant.id)} // Явно преобразуем в строку для ключа
                  style={{
                    display: "flex",
                    listStyle: "none",
                    padding: "10px 0",
                    background:
                      editingId === accountant.id ? "#fff3e0" : "transparent",
                  }}
                >
                  <li style={{ flex: 1 }}>
                    {renderUserField(accountant, "username")}
                  </li>
                  <li style={{ flex: 1 }}>
                    {renderUserField(accountant, "email")}
                  </li>
                  <li style={{ flex: 1 }}>
                    {renderUserField(accountant, "role")}
                  </li>
                  <li
                    className="actions"
                    style={{ width: "200px", display: "flex", gap: "5px" }}
                  >
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
                      <>
                        <button onClick={() => handleEdit(accountant)}>
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(String(accountant.id))}
                          style={{ background: "var(--red)" }}
                        >
                          Удалить
                        </button>
                      </>
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
