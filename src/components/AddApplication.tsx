import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Application, User } from "../types/auth";
import FileUploader from "./FileUploader";

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
  const [files, setFiles] = useState<File[]>([]);
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
    <div className="addApplication">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: "var(--blue)" }}
      >
        <span>Добавить заявку</span>
      </button>

      {isOpen && (
        <div className="addApplication__open">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Название заявки *</label>
              <input
                type="text"
                id="name"
                name="name"
                minLength={3}
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="organization">Организация *</label>
              <input
                type="text"
                id="organization"
                name="organization"
                minLength={3}
                value={formData.organization}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="cost">Стоимость лида</label>
              <input
                type="number"
                id="cost"
                name="cost"
                min="0"
                step="any"
                value={formData.cost}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="quantity">Количество лидов</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                step="any"
                value={formData.quantity}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="comment">Комментарии</label>
              <input
                type="text"
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="assignedAccountantId">Бухгалтер *</label>
              <select
                id="assignedAccountantId"
                name="assignedAccountantId"
                value={formData.assignedAccountantId}
                onChange={handleInputChange}
                required
                disabled={loadingAccountants}
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

            <FileUploader
              onFilesChange={setFiles}
              disabled={loading}
              label="Прикрепить файлы (можно несколько)"
            />

            {error && <div className="addApplication__error">{error}</div>}

            <div className="addApplication__buttons">
              <button type="submit" disabled={loading || loadingAccountants}>
                {loading ? "Создание..." : "Создать заявку"}
              </button>
              <button type="button" onClick={handleCancel}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
