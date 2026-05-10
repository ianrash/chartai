import { useEffect, useRef } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-bullish/90 text-white",
  error: "bg-bearish/90 text-white",
  warning: "bg-neutral/90 text-black",
  info: "bg-accent/90 text-white",
};

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const Icon = icons[type] || icons.info;
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
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium z-50 animate-slide-up shadow-xl backdrop-blur-md ${colors[type]}`}
    >
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
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
