import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Application, User } from "../types/auth";
import FileUploader from "./FileUploader";
import { DOCUMENT_FORMATS, DOCUMENT_TYPES, REQUEST_TYPES } from "../constants";

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
  const [requestType, setRequestType] =
    useState<keyof typeof REQUEST_TYPES>("NEW_CLIENT");
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    assignedAccountantId: "",
    cost: "",
    quantity: "",
    comment: "",
    documentType: "",
    inn: "",
    accountNumber: "",
    periodFrom: "",
    periodTo: "",
    documentFormat: "",
    totalAmount: "",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as keyof typeof REQUEST_TYPES;
    setRequestType(value);

    if (value === "DOCUMENT_REQUEST") {
      setFormData((prev) => ({
        ...prev,
        cost: "",
        quantity: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        documentType: "",
        inn: "",
        accountNumber: "",
        periodFrom: "",
        periodTo: "",
        documentFormat: "",
        totalAmount: "",
      }));
    }
  };

  const resetForm = () => {
    setRequestType("NEW_CLIENT");
    setFormData({
      name: "",
      organization: "",
      assignedAccountantId: "",
      cost: "",
      quantity: "",
      comment: "",
      documentType: "",
      inn: "",
      accountNumber: "",
      periodFrom: "",
      periodTo: "",
      documentFormat: "",
      totalAmount: "",
    });
    setFiles([]);
    setError(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (
      !formData.name ||
      !formData.organization ||
      !formData.assignedAccountantId
    ) {
      setError("Заполните все обязательные поля");
      return false;
    }

    if (requestType === "DOCUMENT_REQUEST") {
      if (!formData.documentType) {
        setError("Выберите тип документа");
        return false;
      }
      if (!formData.inn) {
        setError("Введите ИНН");
        return false;
      }
      if (!formData.accountNumber) {
        setError("Введите номер счета");
        return false;
      }
      if (!formData.periodFrom) {
        setError("Введите дату начала периода");
        return false;
      }
      if (!formData.periodTo) {
        setError("Введите дату окончания периода");
        return false;
      }
      if (!formData.documentFormat) {
        setError("Выберите формат документа");
        return false;
      }
      if (!formData.totalAmount) {
        setError("Введите итоговую сумму");
        return false;
      }

      const innRegex = /^\d{10}$|^\d{12}$/;
      if (!innRegex.test(formData.inn)) {
        setError("ИНН должен содержать 10 или 12 цифр");
        return false;
      }

      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!dateRegex.test(formData.periodFrom)) {
        setError("Дата начала должна быть в формате ДД.ММ.ГГГГ");
        return false;
      }
      if (!dateRegex.test(formData.periodTo)) {
        setError("Дата окончания должна быть в формате ДД.ММ.ГГГГ");
        return false;
      }
    } else {
      if (!formData.cost) {
        setError("Укажите стоимость");
        return false;
      }
      if (!formData.quantity) {
        setError("Укажите количество");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.accessToken) {
      setError("Не авторизован");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Общие поля
      formDataToSend.append("requestType", REQUEST_TYPES[requestType]);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("organization", formData.organization);
      formDataToSend.append(
        "assignedAccountantId",
        formData.assignedAccountantId,
      );

      if (formData.comment) {
        formDataToSend.append("comment", formData.comment);
      }

      if (requestType === "DOCUMENT_REQUEST") {
        formDataToSend.append("documentType", formData.documentType);
        formDataToSend.append("inn", formData.inn);
        formDataToSend.append("accountNumber", formData.accountNumber);
        formDataToSend.append("periodFrom", formData.periodFrom);
        formDataToSend.append("periodTo", formData.periodTo);
        formDataToSend.append("documentFormat", formData.documentFormat);
        formDataToSend.append("totalAmount", formData.totalAmount);
      } else {
        formDataToSend.append("cost", formData.cost);
        formDataToSend.append("quantity", formData.quantity);
      }
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

  const isDocumentRequest = requestType === "DOCUMENT_REQUEST";

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return dateString.split(".").reverse().join("-");
  };

  const formatDateForState = (dateValue: string) => {
    if (!dateValue) return "";
    return dateValue.split("-").reverse().join(".");
  };

  const handleDateChange = (e: any, handleInputChange: any) => {
    const dateValue = e.target.value;
    const formattedDate = formatDateForState(dateValue);

    handleInputChange({
      target: {
        name: e.target.name,
        value: formattedDate,
      },
    });
  };

  return (
    <div className="addApplication">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: "var(--blue)" }}
      >
        <span>Создать запрос</span>
      </button>

      {isOpen && (
        <div className="addApplication__open">
          <form onSubmit={handleSubmit}>
            {/* Тип запроса */}
            <div>
              <label htmlFor="requestType">Тип запроса *</label>
              <select
                id="requestType"
                name="requestType"
                value={requestType}
                onChange={handleRequestTypeChange}
                required
              >
                <option value="NEW_CLIENT">Новый клиент</option>
                <option value="EXISTING_CLIENT">Существующий клиент</option>
                <option value="DOCUMENT_REQUEST">Запрос документа</option>
              </select>
            </div>

            <div>
              <label htmlFor="name">
                {isDocumentRequest ? "Название документа" : "Название франшизы"}{" "}
                *
              </label>
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

            {/* Поля для обычных заявок */}
            {!isDocumentRequest && (
              <>
                <div>
                  <label htmlFor="cost">Стоимость лида *</label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    min="1"
                    step="any"
                    value={formData.cost}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="quantity">Количество лидов *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    step="any"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {isDocumentRequest && (
              <>
                <div>
                  <label htmlFor="documentType">Тип документа *</label>
                  <select
                    id="documentType"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите тип документа</option>
                    <option value={DOCUMENT_TYPES.WORK_CERTIFICATE}>
                      Акт выполненных работ
                    </option>
                    <option value={DOCUMENT_TYPES.RECONCILIATION_ACT}>
                      Акт сверки
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="inn">ИНН *</label>
                  <input
                    type="text"
                    id="inn"
                    name="inn"
                    placeholder="10 или 12 цифр"
                    maxLength={12}
                    value={formData.inn}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber">Номер счета *</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="periodFrom">Период с *</label>
                    <input
                      type="date"
                      id="periodFrom"
                      name="periodFrom"
                      value={formatDateForInput(formData.periodFrom)}
                      onChange={(e) => handleDateChange(e, handleInputChange)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="periodTo">Период по *</label>
                    <input
                      type="date"
                      id="periodTo"
                      name="periodTo"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateForInput(formData.periodTo)}
                      onChange={(e) => handleDateChange(e, handleInputChange)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="documentFormat">Формат документа *</label>
                  <select
                    id="documentFormat"
                    name="documentFormat"
                    value={formData.documentFormat}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите формат</option>
                    <option value={DOCUMENT_FORMATS.PDF}>PDF</option>
                    <option value={DOCUMENT_FORMATS.EDO}>ЭДО</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="totalAmount">Итоговая сумма *</label>
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    min="1"
                    step="any"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Комментарий */}
            <div>
              <label htmlFor="comment">Комментарии</label>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                value={formData.comment}
                onChange={handleInputChange}
              />
            </div>

            {/* Бухгалтер */}
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

            {/* Файлы */}
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
