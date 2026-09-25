import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl bg-[var(--destructive)]/8 border border-[var(--destructive)]/20
        text-[var(--destructive)] animate-fade-in ${className}`}
    >
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
}
