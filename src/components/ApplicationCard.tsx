// ApplicationCard.tsx
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
  const { auth } = useAuth();

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
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#777",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {label}:
            </label>
            <textarea
              value={(value as string) || ""}
              onChange={(e) => handleInputChange(e, field)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
              rows={3}
              placeholder={`Введите ${label.toLowerCase()}`}
            />
          </div>
        );
      }

      return (
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              fontSize: "0.85rem",
              color: "#777",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {label}:
          </label>
          <input
            type={type}
            value={(value as string | number) ?? ""}
            onChange={(e) => handleInputChange(e, field)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "0.9rem",
            }}
            placeholder={`Введите ${label.toLowerCase()}`}
          />
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "10px" }}>
        <span
          style={{
            fontSize: "0.85rem",
            color: "#777",
            display: "block",
            marginBottom: "4px",
          }}
        >
          {label}:
        </span>
        <span style={{ color: "#555", lineHeight: "1.5" }}>{displayValue}</span>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        border: isEditing ? "2px solid #28a745" : "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        transition: "box-shadow 0.3s, border-color 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "10px",
        }}
      >
        {renderEditableField("name", "Название", "text")}
      </div>

      <p style={{ margin: "10px 0", color: "#555", lineHeight: "1.5" }}>
        Создано: {application.Creator?.username || "Не указано"}
      </p>

      <p style={{ margin: "10px 0", color: "#555", lineHeight: "1.5" }}>
        Назначено: {application.AssignedAccountant?.username || "Не назначено"}
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          fontSize: "0.85rem",
          color: "#777",
          marginTop: "10px",
        }}
      >
        <span>
          📅 Создано:{" "}
          {application.createdAt
            ? new Date(application.createdAt).toLocaleDateString()
            : "Дата не указана"}
        </span>
      </div>

      {renderEditableField("organization", "Организация")}
      {renderEditableField("quantity", "Количество лидов", "number")}
      {renderEditableField("cost", "Стоимость лида", "text")}
      {renderEditableField("comment", "Комментарии", "textarea")}

      <div style={{ marginTop: "15px" }}>
        <p style={{ marginBottom: "5px", fontWeight: "500" }}>
          {isEditing ? "Текущие файлы:" : "Файлы:"}
        </p>

        {application.files && application.files.length > 0 ? (
          application.files.map((file, index) => {
            const downloadLink = application.downloadLinks?.[index];

            return (
              <div
                key={index}
                onClick={(e) => downloadFile(file, downloadLink, e)}
                style={{
                  padding: "8px",
                  marginBottom: "5px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  cursor: downloadLink ? "pointer" : "default",
                  transition: "background-color 0.2s",
                  opacity: isEditing ? 0.7 : 1,
                }}
                onMouseEnter={(e) =>
                  downloadLink &&
                  (e.currentTarget.style.backgroundColor = "#e9e9e9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f5f5")
                }
              >
                <p style={{ margin: 0, fontWeight: "500" }}>
                  {file.original}
                  {downloadLink && " ⬇️"}
                </p>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Размер: {(file.size / 1024).toFixed(2)} KB
                </p>
                {!downloadLink && (
                  <p
                    style={{
                      margin: "3px 0 0 0",
                      fontSize: "12px",
                      color: "#ff6b6b",
                    }}
                  >
                    Ссылка для скачивания недоступна
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p
            style={{
              color: "#777",
              fontStyle: "italic",
              padding: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            Файлов нет
          </p>
        )}

        {isEditing && (
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <FileUploader
              onFilesChange={setEditFiles}
              initialFiles={editFiles}
              disabled={isUpdating}
              label="Прикрепить файлы (можно несколько)"
              maxHeight="140px"
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
          borderTop: "1px solid #eee",
          paddingTop: "15px",
        }}
      >
        {isEditing ? (
          <>
            <button
              onClick={saveChanges}
              disabled={isUpdating}
              style={{
                padding: "8px 16px",
                backgroundColor: isUpdating ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                fontWeight: "500",
                opacity: isUpdating ? 0.7 : 1,
              }}
            >
              {isUpdating ? "⏳ Сохранение..." : "💾 Сохранить изменения"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={isUpdating}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                fontWeight: "500",
                opacity: isUpdating ? 0.7 : 1,
              }}
            >
              Отмена
            </button>
          </>
        ) : (
          <button
            onClick={startEditing}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "500",
            }}
          >
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
}
