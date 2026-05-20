import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function percent(value?: number | null) {
  return `${Math.round((value ?? 0) * 100)}%`;
}
