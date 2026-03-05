import type { Application, DownloadLink, FileData, User } from "../types/auth";
import { api } from "../services/api";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import FileUploader from "./FileUploader";
import {
  DIRECTOR,
  ROP,
  DOCUMENT_FORMATS,
  DOCUMENT_TYPES,
  REQUEST_TYPES,
} from "../constants";

interface ApplicationCardProps {
  application: Application;
  onApplicationUpdated?: (
    updatedFields: Partial<Application> & { id: string },
  ) => void;
  onApplicationsUpdate?: () => void;
}

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
  const [accountants, setAccountants] = useState<User[]>([]);
  const [loadingAccountants, setLoadingAccountants] = useState(false);
  const { auth } = useAuth();

  const isDocumentRequest =
    application.requestType === REQUEST_TYPES.DOCUMENT_REQUEST;

  useEffect(() => {
    if (isEditing && accountants.length === 0 && auth.accessToken) {
      fetchAccountants();
    }
  }, [isEditing, auth.accessToken]);

  const fetchAccountants = async () => {
    if (!auth.accessToken) return;

    setLoadingAccountants(true);
    try {
      const data = await api.getUsersByRole("accountant", auth.accessToken);
      setAccountants(data);
    } catch (err) {
      console.error("Ошибка загрузки бухгалтеров:", err);
    } finally {
      setLoadingAccountants(false);
    }
  };

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

    const baseData: Partial<Application> = {
      name: application.name,
      organization: application.organization,
      comment: application.comment,
      requestType: application.requestType,
      assignedAccountantId: application.assignedAccountantId,
    };

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
    let value: string | number = e.target.value;

    if (field === "cost" || field === "quantity" || field === "totalAmount") {
      value = value === "" ? "" : Number(value);
    }

    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditFormData({});
    setEditFiles([]);
  };

  const formatDateForApi = (dateString: string) => {
    if (!dateString) return "";
    if (dateString.includes("-")) return dateString;
    const [day, month, year] = dateString.split(".");
    return `${year}-${month}-${day}`;
  };

  const validateForm = (): boolean => {
    const data = editFormData;

    if (!data.name || !data.organization) {
      alert("Заполните все обязательные поля");
      return false;
    }

    if (!data.assignedAccountantId) {
      alert("Выберите бухгалтера");
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
      let updateData: any = { ...editFormData };

      if (updateData.periodFrom) {
        updateData.periodFrom = formatDateForApi(
          updateData.periodFrom as string,
        );
      }
      if (updateData.periodTo) {
        updateData.periodTo = formatDateForApi(updateData.periodTo as string);
      }

      if (
        !updateData.assignedAccountantId &&
        application.assignedAccountantId
      ) {
        updateData.assignedAccountantId = application.assignedAccountantId;
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      if (hasFiles) {
        const formData = new FormData();

        Object.entries(updateData).forEach(([key, value]) => {
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
          updateData,
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
      console.error("Ошибка при обновлении заявки:", error);
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
        );
      }

      if (type === "textarea") {
        return (
          <textarea
            value={(value as string) || ""}
            onChange={(e) => handleInputChange(e, field)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            placeholder={`Введите ${label.toLowerCase()}`}
          />
        );
      }

      return (
        <input
          type={type}
          value={(value as string | number) ?? ""}
          onChange={(e) => handleInputChange(e, field)}
          onClick={(e) => e.stopPropagation()}
          placeholder={`Введите ${label.toLowerCase()}`}
          step={type === "number" ? "0.01" : undefined}
        />
      );
    }

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
    } else if (field === "assignedAccountantId") {
      const accountant = application.AssignedAccountant;
      formattedValue = accountant?.username || "Не назначено";
    }

    return <span>{formattedValue}</span>;
  };

  const showDocumentFields = isDocumentRequest;

  return (
    <div className={`applications__card ${isEditing ? "editing" : ""}`}>
      <div className="applications__header">
        <h3 className="applications__title">
          {application.name || "Без названия"}
          <span className="applications__id">#{application.id}</span>
        </h3>

        <div className="applications__info">
          <div className="applications__info-item">
            <span className="applications__info-label">Создатель:</span>
            <span className="applications__field-value">
              {application.Creator?.username || "Пользователь удалён"}
            </span>
          </div>
          <div className="applications__info-item">
            <span className="applications__info-label">Бухгалтер:</span>
            <span className="applications__field-value">
              {isEditing ? (
                <select
                  value={
                    editFormData.assignedAccountantId ||
                    application.assignedAccountantId ||
                    ""
                  }
                  onChange={(e) => handleInputChange(e, "assignedAccountantId")}
                  onClick={(e) => e.stopPropagation()}
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
              ) : (
                application.AssignedAccountant?.username || "Не назначено"
              )}
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
                      {renderEditableField("periodFrom", "")}
                      <span style={{ margin: "0 5px" }}>-</span>
                      {renderEditableField("periodTo", "")}
                    </>
                  ) : (
                    <>
                      {application.periodFrom
                        ? new Date(application.periodFrom).toLocaleDateString()
                        : ""}
                      {" - "}
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
                        }).format(Number(application.cost))
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
            <div className="applications__bnts">
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
                Отмена
              </button>
            </div>
          ) : (
            <div className="applications__bnts">
              <button
                onClick={startEditing}
                style={{ backgroundColor: "var(--green)" }}
              >
                Редактировать
              </button>

              {auth.user?.role === DIRECTOR || auth.user?.role === ROP ? (
                <button
                  onClick={deleteCard}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: isDeleting ? "var(--gray)" : "var(--red)",
                  }}
                >
                  {isDeleting ? "Удаление..." : "Удалить"}
                </button>
              ) : null}
            </div>
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
