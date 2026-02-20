import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import { api } from "../services/api";
import { errorDictionary, roles } from "../constants";

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
    setNewUser({
      username: "",
      email: "",
      role: "manager",
      password: "",
    });
    setError(null);
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewUser({
      username: "",
      email: "",
      role: "manager",
      password: "",
    });
    setError(null);
  };

  const handleNewUserChange = (field: string, value: string) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.accessToken) return;

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
        role: "",
        password: "",
      });
      setError(null);
    } catch (err: any) {
      const errorText = err?.message;
      const userMessage = errorDictionary[errorText] || errorText;
      alert(userMessage);
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
          {loadingAccountants && <p>Загрузка...</p>}

          {error && <p className="error">{error}</p>}

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
              <button onClick={handleCreateClick}>Создать пользователя</button>
            </div>

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
                <form onSubmit={handleCreateUser}>
                  <ul
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      listStyle: "none",
                      padding: 0,
                    }}
                  >
                    <li>
                      <input
                        type="text"
                        placeholder="Имя"
                        required
                        minLength={2}
                        maxLength={50}
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
                        required
                        value={newUser.email}
                        onChange={(e) =>
                          handleNewUserChange("email", e.target.value)
                        }
                      />
                    </li>
                    <li>
                      <input
                        type="password"
                        placeholder="Пароль"
                        required
                        minLength={6}
                        maxLength={50}
                        pattern="^(?=.*[A-Za-z])(?=.*\d).*"
                        title="Пароль должен содержать хотя бы одну букву и одну цифру"
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
                        required
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
                        type="submit"
                        style={{ background: "var(--green)" }}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCancel}
                        style={{ background: "var(--blue)" }}
                      >
                        Отмена
                      </button>
                    </li>
                  </ul>
                </form>
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

            {/* Список пользователей */}
            {accountants.map((accountant) => (
              <div key={accountant.id}>
                {editingId === accountant.id ? (
                  // Режим редактирования - форма
                  <form
                    onSubmit={(e) => handleSave(String(accountant.id), e)}
                    style={{
                      display: "flex",
                      listStyle: "none",
                      padding: "10px 0",
                      background: "#fff3e0",
                    }}
                  >
                    <ul
                      style={{
                        display: "flex",
                        width: "100%",
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      <li style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={editForm.username || ""}
                          onChange={(e) =>
                            handleInputChange("username", e.target.value)
                          }
                          className="edit-input"
                          required
                          minLength={2}
                        />
                      </li>
                      <li style={{ flex: 1 }}>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="edit-input"
                          required
                        />
                      </li>
                      <li style={{ flex: 1 }}>
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
                        style={{ width: "200px", display: "flex", gap: "5px" }}
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
                  <ul
                    style={{
                      display: "flex",
                      listStyle: "none",
                      padding: "10px 0",
                      background: "transparent",
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
                      <button onClick={() => handleEdit(accountant)}>
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
              <p style={{ textAlign: "center", padding: "20px" }}>
                Нет пользователей для отображения
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
