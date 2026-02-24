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
    setEditFormData({
      name: application.name,
      organization: application.organization,
      quantity: application.quantity,
      cost: application.cost,
      comment: application.comment,
    });
    setEditFiles([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof Application,
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditFormData({});
    setEditFiles([]);
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
    type: "text" | "number" | "textarea" = "text",
  ) => {
    const value = isEditing ? editFormData[field] : application[field];
    const displayValue: any = value ?? "Не указано";

    if (isEditing) {
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

    return (
      <div className="applications">
        <span>{label}</span>
        <span>{displayValue}</span>
      </div>
    );
  };

  return (
    <div
      className="applications__card"
      style={{
        border: isEditing ? "2px solid var(--green)" : "1px solid var(--gray)",
      }}
    >
      <div className="div1">
        {renderEditableField("name", "Название", "text")}
      </div>
      <div className="div2">
        <div className="applications">
          <span>Создано:</span>
          <span>{application.Creator?.username || "Не указано"}</span>
        </div>
      </div>
      <div className="div3">
        <div className="applications">
          <span>Назначено:</span>
          <span>
            {application.AssignedAccountant?.username || "Не назначено"}
          </span>
        </div>
      </div>
      <div className="div4">
        <div className="applications">
          <span> Создано:</span>
          <span>
            {application.createdAt
              ? new Date(application.createdAt).toLocaleDateString()
              : "Дата не указана"}
          </span>
        </div>
      </div>
      <div className="div5">
        {renderEditableField("organization", "Организация")}
      </div>
      <div className="div6">
        {renderEditableField("quantity", "Количество", "number")}
      </div>
      <div className="div7">
        {renderEditableField("cost", "Стоимость", "text")}
      </div>
      <div className="div8">
        {renderEditableField("comment", "Комментарии", "textarea")}
      </div>
      <div className="application__edit">
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
              style={{
                backgroundColor: "var(--gray)",
              }}
            >
              Отмена
            </button>
          </>
        ) : (
          <button
            onClick={startEditing}
            style={{
              backgroundColor: "var(--green)",
            }}
          >
            Редактировать
          </button>
        )}
        {auth.user && auth.user.role === "director" && !isEditing && (
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
      </div>{" "}
      <div className="div10">
        <div className="applications">
          <span>{isEditing ? "Текущие файлы:" : "Файлы:"}</span>
          <div className="download-card">
            {application.files && application.files.length > 0 ? (
              application.files.map((file, index) => {
                const downloadLink = application.downloadLinks?.[index];

                return (
                  <div
                    key={index}
                    onClick={(e) => downloadFile(file, downloadLink, e)}
                    className="downloadLink-block"
                    onMouseEnter={(e) =>
                      downloadLink &&
                      (e.currentTarget.style.backgroundColor = "var(--bg2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--bg2)")
                    }
                  >
                    <p>
                      {file.original}
                      {downloadLink && " ⬇️"}
                    </p>
                    <p
                      className="download-link"
                      style={{ color: "var(--gray)" }}
                    >
                      Размер: {(file.size / 1024).toFixed(2)} KB
                    </p>
                    {!downloadLink && <p>Ссылка для скачивания недоступна</p>}
                  </div>
                );
              })
            ) : (
              <span>Файлов нет</span>
            )}
          </div>
          {isEditing && (
            <FileUploader
              onFilesChange={setEditFiles}
              initialFiles={editFiles}
              disabled={isUpdating}
              label="Прикрепить файлы (можно несколько)"
            />
          )}
        </div>
      </div>
    </div>
  );
}
