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
    "inline-flex items-center justify-center gap-2 rounded-pill font-arcadia font-medium tracking-[0.01em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "scan-sheen bg-primary text-pure-white hover:bg-primary/90",
    variant === "secondary" && "border border-ghost-blue/15 bg-ghost-blue/10 text-starlight hover:bg-ghost-blue/16",
    variant === "ghost" && "text-starlight hover:bg-ghost-blue/10",
    variant === "outline" && "border border-lead/60 bg-transparent text-starlight hover:border-ghost-blue/50 hover:bg-ghost-blue/10",
    size === "sm" && "h-10 px-5 text-sm",
    size === "md" && "h-12 px-6 text-sm",
    size === "lg" && "h-14 px-7 text-base",
    size === "icon" && "h-11 w-11 p-0",
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
