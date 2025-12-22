import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: "default" | "gradient" | "outlined";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, hover = false, variant = "default", children, ...props },
    ref
  ) => {
    const variants = {
      default: "bg-white shadow-card",
      gradient: "bg-gradient-primary text-white shadow-card",
      outlined: "bg-white border-2 border-secondary-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all duration-200",
          hover && "hover:shadow-card-hover hover:-translate-y-1",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 pb-4", className)}
      {...props}
    />
  );
});

CardHeader.displayName = "CardHeader";

// Card Title
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

// Card Description
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-secondary-600", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

// Card Content
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("", className)} {...props} />;
});

CardContent.displayName = "CardContent";
