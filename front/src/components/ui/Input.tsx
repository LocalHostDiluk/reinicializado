import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle, CheckCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      success,
      icon,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full h-11 bg-white rounded-lg border-2 px-4 py-2.5 text-base transition-all",
              "placeholder:text-neutral-400",
              "focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500",
              "disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed",
              icon && "pl-10",
              error && "border-red-500 focus:border-red-500",
              success && "border-emerald-500 focus:border-emerald-500",
              !error &&
                !success &&
                "border-neutral-300 hover:border-neutral-400",
              className
            )}
            ref={ref}
            {...props}
          />
          {success && !error && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
          )}
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
