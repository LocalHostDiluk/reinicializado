import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 shadow-button focus-visible:ring-primary-500",
      secondary:
        "bg-secondary-700 text-white hover:bg-secondary-800 shadow-button focus-visible:ring-secondary-500",
      outline:
        "border-2 border-secondary-300 text-secondary-700 hover:bg-secondary-50 focus-visible:ring-secondary-400",
      ghost:
        "text-secondary-700 hover:bg-secondary-100 focus-visible:ring-secondary-400",
      danger:
        "bg-error text-white hover:bg-red-700 shadow-button focus-visible:ring-error",
      success:
        "bg-success text-white hover:bg-green-700 shadow-button focus-visible:ring-success",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm rounded-xl",
      md: "h-11 px-5 text-base rounded-xl",
      lg: "h-12 px-6 text-lg rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
