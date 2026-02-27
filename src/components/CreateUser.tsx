import { useState } from "react";
import { roles } from "../constants";
import type { CreateUserProps } from "../types/auth";

export default function CreateUser({ onSubmit, onCancel }: CreateUserProps) {
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "manager",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewUserChange = (field: string, value: string) => {
    setNewUser((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "password" || field === "confirmPassword") {
        if (updated.password !== updated.confirmPassword) {
          setPasswordError("Пароли не совпадают");
        } else {
          setPasswordError(null);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirmPassword, ...userData } = newUser;
      await onSubmit(userData);
      setNewUser({
        username: "",
        email: "",
        role: "manager",
        password: "",
        confirmPassword: "",
      });
      setPasswordError(null);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-user-form">
      <h4>Создать нового пользователя</h4>
      <form className="user__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Имя"
          autoComplete="name"
          id="name"
          name="name"
          pattern="[A-Za-zА-Яа-яЁё\s]+"
          title="Используйте только буквы и пробелы"
          required
          minLength={2}
          maxLength={50}
          value={newUser.username}
          onChange={(e) => handleNewUserChange("username", e.target.value)}
          disabled={isSubmitting}
        />

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          id="email"
          name="email"
          required
          value={newUser.email}
          onChange={(e) => handleNewUserChange("email", e.target.value)}
          disabled={isSubmitting}
        />

        <input
          type="password"
          placeholder="Пароль"
          autoComplete="new-password"
          id="password"
          name="password"
          required
          minLength={6}
          maxLength={50}
          pattern="^(?=.*[A-Za-z])(?=.*\d).*"
          title="Пароль должен содержать хотя бы одну букву и одну цифру"
          value={newUser.password}
          onChange={(e) => handleNewUserChange("password", e.target.value)}
          disabled={isSubmitting}
        />

        <div style={{ position: "relative" }}>
          {passwordError && <span className="error">{passwordError}</span>}
          <input
            type="password"
            placeholder="Подтвердите пароль"
            autoComplete="new-password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={6}
            maxLength={50}
            value={newUser.confirmPassword}
            onChange={(e) =>
              handleNewUserChange("confirmPassword", e.target.value)
            }
            style={passwordError ? { borderColor: "var(--red)" } : {}}
            disabled={isSubmitting}
          />
        </div>

        <select
          value={newUser.role}
          name="role"
          id="role"
          onChange={(e) => handleNewUserChange("role", e.target.value)}
          required
          disabled={isSubmitting}
        >
          {Object.entries(roles).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>

        <div className="actions">
          <button
            type="submit"
            style={{ background: "var(--green)" }}
            disabled={!!passwordError || isSubmitting}
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
        </div>
      </form>
    </div>
  );
}
