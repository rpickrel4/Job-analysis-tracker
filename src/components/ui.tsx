import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

// Shared style primitives. Two rules drive everything here:
// 1. Form controls use text-base (16px) — anything smaller makes iOS Safari
//    zoom the page in on focus, which is most of what read as "broken" UI.
// 2. Interactive elements are at least 44px tall, Apple's minimum tap target.
//
// Every className is combined with twMerge rather than plain string
// concatenation — plain concatenation doesn't let a caller-supplied class
// (e.g. "w-auto") reliably override a base class (e.g. "w-full") in
// Tailwind v4, since which one wins depends on stylesheet order, not
// position in the class string.

const inputBase =
  "w-full rounded-xl border border-sage-200 dark:border-sage-800 bg-white dark:bg-sage-950/40 px-3.5 py-2.5 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sage-500 dark:focus:ring-sage-400 min-h-11";

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">{children}</label>;
}

export function Field({
  label,
  helperText,
  children,
}: {
  label?: string;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      {label && <Label>{label}</Label>}
      {children}
      {helperText && <p className="text-xs text-zinc-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={twMerge(inputBase, className)} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={twMerge(inputBase, "min-h-24 resize-y", className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select className={twMerge(inputBase, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-sage-600 text-white dark:bg-sage-500 active:bg-sage-700 dark:active:bg-sage-600",
  secondary:
    "bg-sage-50 text-sage-900 dark:bg-sage-900/50 dark:text-sage-100 border border-sage-200 dark:border-sage-800 active:bg-sage-100 dark:active:bg-sage-900",
  success: "bg-sage-700 text-white dark:bg-sage-600 active:bg-sage-800 dark:active:bg-sage-700",
  danger: "bg-clay-600 text-white active:bg-clay-700",
  ghost: "text-sage-700 dark:text-sage-400 active:opacity-60",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={twMerge(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 min-h-11 text-base font-medium transition-opacity disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={twMerge(
        "rounded-2xl border border-sage-200/70 dark:border-sage-900 bg-white dark:bg-sage-950/40 p-4 sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}
