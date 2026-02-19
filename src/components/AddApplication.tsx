import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Application, User } from "../types/auth";

interface AddApplicationProps {
  onApplicationAdded?: (application: Application) => void;
  onApplicationsUpdate?: () => void;
}

export default function AddApplication({
  onApplicationAdded,
  onApplicationsUpdate,
}: AddApplicationProps) {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    assignedAccountantId: "",
    cost: "",
    quantity: "",
    comment: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accountants.length === 0 && auth.accessToken) {
      fetchAccountants();
    }
  }, [isOpen, auth.accessToken]);

  const fetchAccountants = async () => {
    if (!auth.accessToken) return;

    setLoadingAccountants(true);
    setError(null);

    try {
      const data = await api.getUsersByRole("accountant", auth.accessToken);
      setAccountants(data);
    } catch (err) {
      console.error("Ошибка загрузки бухгалтеров:", err);
      setError("Не удалось загрузить список бухгалтеров");
    } finally {
      setLoadingAccountants(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      organization: "",
      assignedAccountantId: "",
      cost: "",
      quantity: "",
      comment: "",
    });
    setFile(null);
    setError(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.accessToken) {
      setError("Не авторизован");
      return;
    }

    if (
      !formData.name ||
      !formData.organization ||
      !formData.assignedAccountantId
    ) {
      setError("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let newApplication: Application;

      if (file) {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("organization", formData.organization);
        formDataToSend.append(
          "assignedAccountantId",
          formData.assignedAccountantId,
        );
        formDataToSend.append("cost", formData.cost);
        formDataToSend.append("quantity", formData.quantity);
        formDataToSend.append("comment", formData.comment || "");
        formDataToSend.append("files", file);

        newApplication = await api.createApplication(
          auth.accessToken,
          formDataToSend,
        );
      } else {
        const applicationData = {
          name: formData.name,
          organization: formData.organization,
          assignedAccountantId: formData.assignedAccountantId,
          cost: formData.cost,
          quantity: formData.quantity,
          comment: formData.comment,
        };

        newApplication = await api.createApplication(
          auth.accessToken,
          applicationData,
        );
      }

      // Оптимистичное добавление в список
      if (onApplicationAdded) {
        onApplicationAdded(newApplication);
      }

      resetForm();
      setIsOpen(false);

      // Можно оставить как запасной вариант
      if (onApplicationsUpdate) {
        onApplicationsUpdate();
      }
    } catch (err) {
      console.error("Ошибка при создании заявки:", err);
      setError(
        err instanceof Error ? err.message : "Ошибка при создании заявки",
      );
      // При ошибке можно вызвать onApplicationsUpdate для синхронизации
      if (onApplicationsUpdate) onApplicationsUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Добавить заявку</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: "10px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px solid #dee2e6",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Поля формы остаются без изменений */}
            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Название заявки *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                minLength={3}
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="organization"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Организация *
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                minLength={3}
                value={formData.organization}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="cost"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Стоимость лида
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                min="0"
                step="any"
                value={formData.cost}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="quantity"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Количество лидов
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                step="any"
                value={formData.quantity}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="comment"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Комментарии
              </label>
              <input
                type="text"
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="assignedAccountantId"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Бухгалтер *
              </label>
              <select
                id="assignedAccountantId"
                name="assignedAccountantId"
                value={formData.assignedAccountantId}
                onChange={handleInputChange}
                required
                disabled={loadingAccountants}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  backgroundColor: loadingAccountants ? "#e9ecef" : "white",
                }}
              >
                <option value="">
                  {loadingAccountants ? "Загрузка..." : "Выберите бухгалтера"}
                </option>
                {accountants.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.username}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                htmlFor="file"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Прикрепить файл
              </label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              />
              {file && (
                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "0.9rem",
                    color: "#666",
                  }}
                >
                  Выбран файл: {file.name}
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  border: "1px solid #f5c6cb",
                  borderRadius: "4px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={loading || loadingAccountants}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    loading || loadingAccountants ? "not-allowed" : "pointer",
                  opacity: loading || loadingAccountants ? 0.7 : 1,
                }}
              >
                {loading ? "Создание..." : "Создать заявку"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
