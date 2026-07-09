"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/crm-ui";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold shrink-0",
        className ?? "w-7 h-7"
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-black/4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-foreground/40">{label}</span>
        {icon && <span className="text-foreground/30">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-[12px] text-foreground/40">{hint}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-white border border-black/4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/4">
          {typeof title === "string" ? (
            <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="text-foreground/15 mb-3">{icon}</div>}
      <p className="text-[14px] font-semibold text-foreground/60">{title}</p>
      {hint && <p className="text-[12px] text-foreground/35 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#fafaf9] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="text-foreground/30 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-black/5 bg-white">{footer}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-foreground/50">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/8 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/25 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "resize-none", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none", props.className)} />;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
}) {
  const variants = {
    primary:
      "bg-foreground text-background hover:opacity-90 disabled:opacity-40",
    ghost: "text-foreground/50 hover:text-foreground hover:bg-black/4",
    outline: "border border-black/10 text-foreground hover:bg-black/3",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    />
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
