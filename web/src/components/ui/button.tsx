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
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "scan-sheen bg-gradient-to-r from-primary via-cyan to-secondary text-white shadow-glow hover:-translate-y-0.5 hover:shadow-halo",
    variant === "secondary" && "bg-ink text-white shadow-soft hover:-translate-y-0.5 hover:bg-slate-900",
    variant === "ghost" && "text-slate-700 hover:bg-white/70 hover:text-ink",
    variant === "outline" && "border border-white/80 bg-white/74 text-slate-800 shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white",
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
