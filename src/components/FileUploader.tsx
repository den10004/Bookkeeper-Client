import { useState, useEffect, useRef } from "react";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: File[];
  disabled?: boolean;
  label?: string;
  showFileList?: boolean;
  accept?: string;
  multiple?: boolean;
}

export default function FileUploader({
  onFilesChange,
  initialFiles = [],
  disabled = false,
  label = "Прикрепить файлы (можно несколько)",
  showFileList = true,
  accept = "*/*",
  multiple = true,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [inputKey, setInputKey] = useState(Date.now());
  const initialFilesRef = useRef(initialFiles);

  useEffect(() => {
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
    <div className="upload">
      <label htmlFor="file-upload">{label}</label>

      <input
        key={inputKey}
        type="file"
        id="file-upload"
        multiple={multiple}
        onChange={handleFilesChange}
        disabled={disabled}
        accept={accept}
        style={{
          border:
            files.length > 0
              ? "2px solid var(--grren)"
              : "2px dashed var(--blue)",
        }}
      />

      {showFileList && files.length > 0 && (
        <div className="upload__showFileList">
          <strong>Выбрано файлов: {files.length}</strong>
          <ul>
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}-${file.lastModified}-${file.size}`}
              >
                <span>
                  {file.name}
                  <span> ({formatFileSize(file.size)} KB)</span>
                </span>
                <button type="button" onClick={() => handleRemoveFile(index)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFileList && files.length === 0 && !disabled && (
        <div className="upload__error">
          {multiple ? "Файлы не выбраны" : "Файл не выбран"}
        </div>
      )}
    </div>
  );
}
