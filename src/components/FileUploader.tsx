import { useState, useEffect, useRef } from "react";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: File[];
  disabled?: boolean;
  maxHeight?: string;
  label?: string;
  showFileList?: boolean;
  accept?: string;
  multiple?: boolean;
}

export default function FileUploader({
  onFilesChange,
  initialFiles = [],
  disabled = false,
  maxHeight = "140px",
  label = "Прикрепить файлы (можно несколько)",
  showFileList = true,
  accept = "*/*",
  multiple = true,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [inputKey, setInputKey] = useState(Date.now());
  const initialFilesRef = useRef(initialFiles);

  // Синхронизация с initialFiles только при реальных изменениях
  useEffect(() => {
    // Проверяем, изменились ли файлы (по количеству или по содержимому)
    const haveFilesChanged =
      initialFiles.length !== initialFilesRef.current.length ||
      initialFiles.some((file, index) => {
        const currentFile = initialFilesRef.current[index];
        return (
          !currentFile ||
          file.name !== currentFile.name ||
          file.size !== currentFile.size ||
          file.lastModified !== currentFile.lastModified
        );
      });

    if (haveFilesChanged) {
      setFiles(initialFiles);
      initialFilesRef.current = initialFiles;
    }
  }, [initialFiles]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    // Сбрасываем input, чтобы можно было выбрать тот же файл снова
    setInputKey(Date.now());
  };

  const handleClearAll = () => {
    setFiles([]);
    onFilesChange([]);
    setInputKey(Date.now());
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024).toFixed(1);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <label
        htmlFor="file-upload"
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "bold",
          fontSize: "1rem",
        }}
      >
        {label}
      </label>

      <input
        key={inputKey}
        type="file"
        id="file-upload"
        multiple={multiple}
        onChange={handleFilesChange}
        disabled={disabled}
        accept={accept}
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          border: files.length > 0 ? "2px solid #28a745" : "2px dashed #007bff",
          borderRadius: "8px",
          backgroundColor: files.length > 0 ? "#e6ffed" : "#f0f8ff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "1rem",
          opacity: disabled ? 0.6 : 1,
        }}
      />

      {showFileList && files.length > 0 && (
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
              maxHeight: maxHeight,
              overflowY: "auto",
            }}
          >
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}-${file.lastModified}-${file.size}`}
                style={{
                  marginBottom: "6px",
                  wordBreak: "break-all",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {file.name}
                  <span style={{ color: "#555", fontSize: "0.85rem" }}>
                    {" "}
                    ({formatFileSize(file.size)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  style={{
                    marginLeft: "8px",
                    padding: "2px 8px",
                    backgroundColor: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleClearAll}
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

      {showFileList && files.length === 0 && !disabled && (
        <div
          style={{
            marginTop: "8px",
            color: "#777",
            fontSize: "0.9rem",
          }}
        >
          {multiple
            ? "Файлы не выбраны (можно выбрать сразу несколько — Ctrl / Shift)"
            : "Файл не выбран"}
        </div>
      )}
    </div>
  );
}
