import { useState, useEffect } from "react";
import { roles } from "../constants";
import type { User } from "../types/auth";

interface EditUserFormProps {
  user: User;
  onSave: (userId: string, formData: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

export default function EditUserForm({
  user,
  onSave,
  onCancel,
}: EditUserFormProps) {
  const [editForm, setEditForm] = useState<Partial<User>>({
    username: user.username,
    email: user.email,
    role: user.role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сбрасываем форму при изменении пользователя
  useEffect(() => {
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  }, [user]);

  const handleInputChange = (field: keyof User, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmMessage =
      "Вы уверены, что хотите сохранить изменения для пользователя";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(String(user.id), editForm);
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
      console.error("Ошибка при сохранении:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-user-form">
      <h3 style={{ textAlign: "center" }}>
        Редактирование пользователя {user.username}
      </h3>
      <form onSubmit={handleSubmit}>
        <ul
          className="user__form-data"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <li>
            <label htmlFor="username">Имя пользователя:</label>
            <input
              id="username"
              type="text"
              pattern="[A-Za-zА-Яа-яЁё\s]+"
              title="Используйте только буквы и пробелы"
              value={editForm.username || ""}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="edit-input"
              required
              minLength={2}
              disabled={isSubmitting}
            />
          </li>
          <li>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={editForm.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </li>
          <li>
            <label htmlFor="password">Пароль:</label>
            <input
              id="password"
              type="password"
              value={editForm.password || ""}
              placeholder="Оставьте пустым, если не хотите менять"
              onChange={(e) => handleInputChange("password", e.target.value)}
              disabled={isSubmitting}
            />
          </li>
          <li>
            <label htmlFor="role">Роль:</label>
            <select
              id="role"
              value={editForm.role || ""}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="edit-input"
              required
              disabled={isSubmitting}
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
            style={{ display: "flex", gap: "5px", justifyContent: "center" }}
          >
            <button
              type="submit"
              style={{ background: "var(--green)" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{ background: "var(--blue)" }}
              disabled={isSubmitting}
            >
              Отмена
            </button>
          </li>
        </ul>
      </form>
    </div>
  );
}
