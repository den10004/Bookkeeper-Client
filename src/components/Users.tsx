import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import { api } from "../services/api";
import { errorDictionary, roles } from "../constants";
import CreateUserForm from "./CreateUser";
import EditUserForm from "./EditUserForm";

export default function Users() {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  console.log(auth.user?.id);

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
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (userId: string, formData: Partial<User>) => {
    if (!auth.accessToken) return;

    try {
      await api.changeUsers(auth.accessToken, userId, formData);
      setAccountants(
        accountants.map((user) =>
          user.id === Number(userId) ? { ...user, ...formData } : user,
        ),
      );

      setEditingId(null);
      setError(null);
    } catch (err: any) {
      const errorText = err?.message;
      const userMessage = errorDictionary[errorText] || errorText;
      alert(userMessage);
      setError(userMessage);
      throw err;
    }
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
      throw err;
    }
  };

  const renderUserField = (user: User, field: keyof User) => {
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
                  <EditUserForm
                    user={accountant}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ) : (
                  <ul className="create-user__form">
                    <li>{renderUserField(accountant, "username")}</li>
                    <li>{renderUserField(accountant, "email")}</li>
                    <li>{renderUserField(accountant, "role")}</li>

                    <li className="actions">
                      {auth.user?.id != accountant.id && (
                        <>
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
                          </button>{" "}
                        </>
                      )}
                    </li>
                  </ul>
                )}
              </div>
            ))}

            {accountants.length === 0 && !loadingAccountants && !isCreating && (
              <p>Нет пользователей для отображения</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
