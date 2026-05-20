import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
};

export function buttonStyles({
  className,
  variant = "primary",
  size = "md"
}: {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "bg-primary text-white shadow-glow hover:-translate-y-0.5 hover:bg-blue-600",
    variant === "secondary" && "bg-secondary text-white shadow-soft hover:-translate-y-0.5 hover:bg-teal-600",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    variant === "outline" && "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-base",
    size === "icon" && "h-10 w-10 p-0",
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonStyles({ className, variant, size })}
      {...props}
    />
  )
);

Button.displayName = "Button";
