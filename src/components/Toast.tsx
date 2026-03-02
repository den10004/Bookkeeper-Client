import { useEffect } from "react";

type ToastType = "success" | "info" | "warning" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: "✅",
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
  };

  const colors = {
    success: "#4caf50",
    info: "#2196f3",
    warning: "#ff9800",
    error: "#f44336",
  };

  return (
    <div
      className="toast"
      style={{
        backgroundColor: colors[type],
        borderLeft: `6px solid ${colors[type]}`,
      }}
    >
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
      <div className="toast-progress-bar" />
    </div>
  );
}
