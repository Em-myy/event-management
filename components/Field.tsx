import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
  icon?: ReactNode; 
  action?: ReactNode;
}

export default function Field({ icon, label, action, children }: FieldProps) {
  return (
    <div className="w-full animate-fade-in">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase break-words">
        {label}
      </label>
      <div className="relative flex items-center w-full">
        
        {/* Left Icon */}
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}
        
        {/* Input/Select Element */}
        <div className="w-full">
          {children}
        </div>

        {/* Right Action (e.g., Show/Hide Password button) */}
        {action && (
          <span className="absolute right-3 flex items-center justify-center shrink-0 z-10">
            {action}
          </span>
        )}

      </div>
    </div>
  );
}