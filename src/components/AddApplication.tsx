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
  const [files, setFiles] = useState<File[]>([]); // ← изменено с File | null
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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
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
    setFiles([]);
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
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("organization", formData.organization);
      formDataToSend.append(
        "assignedAccountantId",
        formData.assignedAccountantId,
      );
      if (formData.cost) formDataToSend.append("cost", formData.cost);
      if (formData.quantity)
        formDataToSend.append("quantity", formData.quantity);
      if (formData.comment) formDataToSend.append("comment", formData.comment);

      // Добавляем все выбранные файлы
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const newApplication = await api.createApplication(
        auth.accessToken,
        formDataToSend,
      );

      if (onApplicationAdded) {
        onApplicationAdded(newApplication);
      }

      resetForm();
      setIsOpen(false);

      if (onApplicationsUpdate) {
        onApplicationsUpdate();
      }
    } catch (err) {
      console.error("Ошибка при создании заявки:", err);
      setError(
        err instanceof Error ? err.message : "Ошибка при создании заявки",
      );
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

            {/* Блок множественной загрузки файлов */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="files"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                Прикрепить файлы (можно несколько)
              </label>

              <input
                type="file"
                id="files"
                multiple
                onChange={handleFilesChange}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px",
                  border:
                    files.length > 0
                      ? "2px solid #28a745"
                      : "2px dashed #007bff",
                  borderRadius: "8px",
                  backgroundColor: files.length > 0 ? "#e6ffed" : "#f0f8ff",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                }}
              />

              {files.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "#e9f7ff",
                    border: "1px solid #b3e0ff",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                  }}
                >
                  <strong>Выбрано файлов: {files.length}</strong>
                  <ul
                    style={{
                      margin: "8px 0 0 0",
                      paddingLeft: "20px",
                      listStyle: "disc",
                      maxHeight: "140px",
                      overflowY: "auto",
                    }}
                  >
                    {files.map((file, index) => (
                      <li
                        key={index}
                        style={{
                          marginBottom: "6px",
                          wordBreak: "break-all",
                        }}
                      >
                        {file.name}
                        <span style={{ color: "#555", fontSize: "0.85rem" }}>
                          {" "}
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    style={{
                      marginTop: "10px",
                      padding: "6px 12px",
                      backgroundColor: "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Очистить все файлы
                  </button>
                </div>
              )}

              {files.length === 0 && !loading && (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#777",
                    fontSize: "0.9rem",
                  }}
                >
                  Файлы не выбраны (можно выбрать сразу несколько — Ctrl /
                  Shift)
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
