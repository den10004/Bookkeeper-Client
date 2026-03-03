import type { Application, DownloadLink, FileData } from "../types/auth";
import { api } from "../services/api";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import FileUploader from "./FileUploader";

interface ApplicationCardProps {
  application: Application;
  onApplicationUpdated?: (
    updatedFields: Partial<Application> & { id: string },
  ) => void;
  onApplicationsUpdate?: () => void;
}

const REQUEST_TYPES = {
  NEW_CLIENT: "new_client",
  EXISTING_CLIENT: "existing_client",
  DOCUMENT_REQUEST: "document_request",
} as const;

const DOCUMENT_TYPES = {
  WORK_CERTIFICATE: "work_certificate",
  RECONCILIATION_ACT: "reconciliation_act",
} as const;

const DOCUMENT_FORMATS = {
  PDF: "pdf",
  EDO: "edo",
} as const;

export default function ApplicationCard({
  application,
  onApplicationUpdated,
  onApplicationsUpdate,
}: ApplicationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Application>>({});
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { auth } = useAuth();

  const isDocumentRequest =
    application.requestType === REQUEST_TYPES.DOCUMENT_REQUEST;

  const deleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Вы действительно хотите удалить заявку?",
    );

    if (!confirmDelete) {
      return;
    }

    if (!auth.accessToken) {
      console.error("Токен не найден");
      return;
    }

    setIsDeleting(true);

    try {
      await api.deleteApplication(auth.accessToken, application.id);

      if (onApplicationsUpdate) {
        await onApplicationsUpdate();
      }
    } catch (error) {
      console.error("Ошибка при удалении заявки:", error);

      if (onApplicationsUpdate) {
        await onApplicationsUpdate();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);

    // Базовые поля
    const baseData: Partial<Application> = {
      name: application.name,
      organization: application.organization,
      comment: application.comment,
      requestType: application.requestType,
    };

    // Поля в зависимости от типа
    if (isDocumentRequest) {
      setEditFormData({
        ...baseData,
        documentType: application.documentType,
        inn: application.inn,
        accountNumber: application.accountNumber,
        periodFrom: application.periodFrom,
        periodTo: application.periodTo,
        documentFormat: application.documentFormat,
        totalAmount: application.totalAmount,
      });
    } else {
      setEditFormData({
        ...baseData,
        quantity: application.quantity,
        cost: application.cost,
      });
    }

    setEditFiles([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof Application,
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleRequestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target
      .value as (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

    // Сброс полей при смене типа
    if (value === REQUEST_TYPES.DOCUMENT_REQUEST) {
      setEditFormData((prev) => ({
        ...prev,
        requestType: value,
        quantity: undefined,
        cost: undefined,
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        requestType: value,
        documentType: undefined,
        inn: undefined,
        accountNumber: undefined,
        periodFrom: undefined,
        periodTo: undefined,
        documentFormat: undefined,
        totalAmount: undefined,
      }));
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditFormData({});
    setEditFiles([]);
  };

  const validateForm = (): boolean => {
    const data = editFormData;

    if (!data.name || !data.organization) {
      alert("Заполните все обязательные поля");
      return false;
    }

    if (data.requestType === REQUEST_TYPES.DOCUMENT_REQUEST) {
      if (!data.documentType) {
        alert("Выберите тип документа");
        return false;
      }
      if (!data.inn) {
        alert("Введите ИНН");
        return false;
      }
      if (!data.accountNumber) {
        alert("Введите номер счета");
        return false;
      }
      if (!data.periodFrom) {
        alert("Введите дату начала периода");
        return false;
      }
      if (!data.periodTo) {
        alert("Введите дату окончания периода");
        return false;
      }
      if (!data.documentFormat) {
        alert("Выберите формат документа");
        return false;
      }
      if (!data.totalAmount) {
        alert("Введите итоговую сумму");
        return false;
      }

      // Валидация ИНН
      const innRegex = /^\d{10}$|^\d{12}$/;
      if (data.inn && !innRegex.test(data.inn as string)) {
        alert("ИНН должен содержать 10 или 12 цифр");
        return false;
      }
    } else {
      if (!data.quantity) {
        alert("Укажите количество");
        return false;
      }
      if (!data.cost) {
        alert("Укажите стоимость");
        return false;
      }
    }

    return true;
  };

  const saveChanges = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.accessToken) {
      console.error("Токен не найден");
      return;
    }

    const hasTextChanges = Object.keys(editFormData).length > 0;
    const hasFiles = editFiles.length > 0;

    if (!hasTextChanges && !hasFiles) {
      setIsEditing(false);
      setEditFormData({});
      setEditFiles([]);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    try {
      if (hasFiles) {
        const formData = new FormData();

        Object.entries(editFormData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        editFiles.forEach((file) => {
          formData.append("files", file);
        });

        await api.updateApplication(auth.accessToken, application.id, formData);
      } else {
        await api.updateApplication(
          auth.accessToken,
          application.id,
          editFormData,
        );
      }

      if (onApplicationUpdated && hasTextChanges) {
        onApplicationUpdated({ id: application.id, ...editFormData });
      }

      if (onApplicationsUpdate) {
        await onApplicationsUpdate();
      }

      setIsEditing(false);
      setEditFormData({});
      setEditFiles([]);
    } catch (error) {
      alert("Ошибка при обновлении заявки. Пожалуйста, попробуйте снова.");

      if (onApplicationsUpdate) {
        await onApplicationsUpdate();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadFile = (
    fileData: FileData,
    downloadLink: DownloadLink | undefined,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (!downloadLink || !downloadLink.url) {
      console.error("Ссылка для скачивания отсутствует");
      return;
    }

    const link = document.createElement("a");
    link.href = downloadLink.url;
    link.download = fileData.original || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEditableField = (
    field: keyof Application,
    label: string,
    type: "text" | "number" | "textarea" | "select" = "text",
    options?: { value: string; label: string }[],
  ) => {
    const value = isEditing ? editFormData[field] : application[field];
    const displayValue: any = value ?? "Не указано";

    if (isEditing) {
      if (type === "select" && options) {
        return (
          <div className="applications">
            <label>{label}:</label>
            <select
              value={(value as string) || ""}
              onChange={(e) => handleInputChange(e, field)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Выберите {label.toLowerCase()}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      if (type === "textarea") {
        return (
          <div className="applications">
            <label>{label}:</label>
            <textarea
              value={(value as string) || ""}
              onChange={(e) => handleInputChange(e, field)}
              onClick={(e) => e.stopPropagation()}
              rows={3}
              placeholder={`Введите ${label.toLowerCase()}`}
            />
          </div>
        );
      }

      return (
        <div className="applications">
          <label>{label}:</label>
          <input
            type={type}
            value={(value as string | number) ?? ""}
            onChange={(e) => handleInputChange(e, field)}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Введите ${label.toLowerCase()}`}
          />
        </div>
      );
    }

    // Форматирование для отображения
    let formattedValue = displayValue;

    if (field === "documentType") {
      const docTypeMap: Record<string, string> = {
        work_certificate: "Акт выполненных работ",
        reconciliation_act: "Акт сверки",
      };
      formattedValue = docTypeMap[displayValue] || displayValue;
    } else if (field === "documentFormat") {
      const formatMap: Record<string, string> = {
        pdf: "PDF",
        edo: "ЭДО",
      };
      formattedValue = formatMap[displayValue] || displayValue;
    } else if (field === "totalAmount" || field === "cost") {
      formattedValue =
        displayValue !== "Не указано" && displayValue
          ? new Intl.NumberFormat("ru-RU", {
              style: "currency",
              currency: "RUB",
            }).format(Number(displayValue))
          : displayValue;
    } else if (field === "periodFrom" || field === "periodTo") {
      formattedValue =
        displayValue !== "Не указано" && displayValue
          ? new Date(displayValue).toLocaleDateString("ru-RU")
          : displayValue;
    } else if (field === "requestType") {
      const requestTypeMap: Record<string, string> = {
        new_client: "Новый клиент",
        existing_client: "Существующий клиент",
        document_request: "Запрос документа",
      };
      formattedValue = requestTypeMap[displayValue] || displayValue;
    }

    return (
      <div className="applications">
        <span>{label}</span>
        <span>{formattedValue}</span>
      </div>
    );
  };

  const showDocumentFields = isDocumentRequest;

  return (
    <div
      className={`applications__card ${isEditing ? "editing" : ""}`}
      style={{
        border: isEditing ? "2px solid var(--green)" : "1px solid var(--gray)",
      }}
    >
      {/* Заголовок */}
      <div className="applications__header">
        <h3 className="applications__title">
          {application.name || "Без названия"}
          <span className="applications__id">#{application.id}</span>
        </h3>

        <div className="applications__info">
          <div className="applications__info-item">
            <span className="applications__info-label">Создатель:</span>
            <span className="applications__field-value">
              {application.Creator?.username || "Не указано"}
            </span>
          </div>
          <div className="applications__info-item">
            <span className="applications__info-label">Бухгалтер:</span>
            <span className="applications__field-value">
              {application.AssignedAccountant?.username || "Не назначено"}
            </span>
          </div>
          <div className="applications__info-item">
            <span className="applications__info-label">Дата:</span>
            <span className="applications__field-value">
              {application.createdAt
                ? new Date(application.createdAt).toLocaleDateString()
                : "Не указана"}
            </span>
          </div>
        </div>
        {!isEditing && (
          <span
            className={`applications__type-badge ${application.requestType}`}
          >
            {renderEditableField("requestType", "")}
          </span>
        )}
      </div>

      <div className="applications__row">
        <div className="applications__field-group">
          <div className="applications__field">
            <span className="applications__field-label">Организация:</span>
            <span className="applications__field-value">
              {isEditing
                ? renderEditableField("organization", "")
                : application.organization || "Не указано"}
            </span>
          </div>
        </div>

        {showDocumentFields ? (
          <>
            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("documentType", "", "select", [
                        {
                          value: DOCUMENT_TYPES.WORK_CERTIFICATE,
                          label: "Акт выполненных работ",
                        },
                        {
                          value: DOCUMENT_TYPES.RECONCILIATION_ACT,
                          label: "Акт сверки",
                        },
                      ])
                    : renderEditableField("documentType", "")}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">ИНН:</span>
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("inn", "")
                    : application.inn || "Не указан"}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Счёт:</span>
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("accountNumber", "")
                    : application.accountNumber || "Не указан"}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Период:</span>
                <span className="applications__field-value">
                  {isEditing ? (
                    <>
                      {renderEditableField("periodFrom", "")} -{" "}
                      {renderEditableField("periodTo", "")}
                    </>
                  ) : (
                    <>
                      {application.periodFrom
                        ? new Date(application.periodFrom).toLocaleDateString()
                        : ""}{" "}
                      -{" "}
                      {application.periodTo
                        ? new Date(application.periodTo).toLocaleDateString()
                        : ""}
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Формат:</span>
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("documentFormat", "", "select", [
                        { value: DOCUMENT_FORMATS.PDF, label: "PDF" },
                        { value: DOCUMENT_FORMATS.EDO, label: "ЭДО" },
                      ])
                    : renderEditableField("documentFormat", "")}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Сумма:</span>
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("totalAmount", "", "number")
                    : application.totalAmount
                      ? new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        }).format(application.totalAmount)
                      : "Не указана"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Кол-во:</span>
                <span className="applications__field-value">
                  {isEditing
                    ? renderEditableField("quantity", "", "number")
                    : application.quantity || 0}
                </span>
              </div>
            </div>

            <div className="applications__field-group">
              <div className="applications__field">
                <span className="applications__field-label">Стоимость:</span>
                <span className="applications__field-value currency">
                  {isEditing
                    ? renderEditableField("cost", "", "number")
                    : application.cost
                      ? new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        }).format(application.cost)
                      : "Не указана"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="applications__row2">
        <div className="applications__field-group">
          <div className="applications__field" style={{ width: "100%" }}>
            <span className="applications__field-label">Комментарий:</span>
            <span className="applications__field-value">
              {isEditing ? (
                <div>{renderEditableField("comment", "", "textarea")}</div>
              ) : (
                application.comment || "Нет комментариев"
              )}
            </span>
          </div>
        </div>

        <div>
          {isEditing ? (
            <>
              <button
                onClick={saveChanges}
                disabled={isUpdating}
                style={{
                  backgroundColor: isUpdating ? "var(--gray)" : "var(--green)",
                }}
              >
                {isUpdating ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={isUpdating}
                style={{ backgroundColor: "var(--gray)" }}
              >
                ✕ Отмена
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                style={{ backgroundColor: "var(--green)" }}
              >
                Редактировать
              </button>
              {auth.user && auth.user.role === "director" && (
                <button
                  onClick={deleteCard}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: isDeleting ? "var(--gray)" : "var(--red)",
                  }}
                >
                  {isDeleting ? "Удаление..." : "Удалить"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="applications__files">
        <div className="applications__files-title">Файлы:</div>
        {application.files && application.files.length > 0 ? (
          <div className="applications__files-list">
            {application.files.map((file, index) => {
              const downloadLink = application.downloadLinks?.[index];
              return (
                <div
                  key={index}
                  className="applications__file-item"
                  onClick={(e) => downloadFile(file, downloadLink, e)}
                >
                  <span className="applications__file-name">
                    {file.original}
                  </span>
                  <span className="applications__file-size">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  {downloadLink && " ⬇️"}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="applications__files-empty">Файлы отсутствуют</div>
        )}
      </div>

      {isEditing && (
        <div className="applications__files">
          <FileUploader
            onFilesChange={setEditFiles}
            initialFiles={editFiles}
            disabled={isUpdating}
            label="Прикрепить файлы"
          />
        </div>
      )}
    </div>
  );
}
