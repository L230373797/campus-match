import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx and tailwind-merge
 * Usage: cn("base-class", condition && "conditional-class", "another-class")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
