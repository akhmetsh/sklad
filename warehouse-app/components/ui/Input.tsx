import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const baseClass =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500";

const errorClass = "border-red-400 focus:ring-red-500 focus:border-red-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function Input({ className, error, ...props }, ref) {
    return <input ref={ref} className={cn(baseClass, error && errorClass, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  function Textarea({ className, error, ...props }, ref) {
    return <textarea ref={ref} className={cn(baseClass, error && errorClass, className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  function Select({ className, error, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(baseClass, "pr-8 appearance-none bg-no-repeat", error && errorClass, className)}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z' clip-rule='evenodd' /%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.25rem 1.25rem",
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);
