import { useEffect, useRef } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "var(--bullish)",
  error: "var(--bearish)",
  warning: "var(--neutral)",
  info: "var(--accent)",
};

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const Icon = icons[type] || icons.info;
  const iconColor = colors[type] || colors.info;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      className={`glass rounded-xl flex items-center gap-3 animate-slide-up w-full max-w-sm`}
      style={{
        padding: "10px 14px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-pop)",
      }}
    >
      <Icon size={16} style={{ color: iconColor, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)" }}>
        {message}
      </span>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
