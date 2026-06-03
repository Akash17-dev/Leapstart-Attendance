/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createPortal } from "react-dom";

// Material Symbols Rounded Icon Wrapper
interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
}

export function MaterialIcon({ name, className = "", fill = false, ...props }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none text-current leading-none ${className}`}
      style={{
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        fontSize: "inherit"
      }}
      {...props}
    >
      {name}
    </span>
  );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "brand" | "danger" | "text";
  loading?: boolean;
  icon?: string;
  children?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider px-5 py-3 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50";

  const variants = {
    primary: "bg-[var(--text-primary)] text-[var(--bg-page)] hover:opacity-90 shadow-sm",
    secondary: "bg-transparent text-current border border-[var(--border-color)] hover:bg-[var(--text-primary)]/5",
    brand: "bg-[#D4AF37] text-black hover:bg-[#E5C158] shadow-[0_4px_16px_rgba(212,175,55,0.2)]",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444] hover:text-white",
    text: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <MaterialIcon name="progress_activity" className="animate-spin text-base" />
      ) : icon ? (
        <MaterialIcon name={icon} className="text-base" />
      ) : null}
      {children}
    </button>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  isTextArea?: boolean;
  rows?: number;
}

export function Input({
  label,
  error,
  icon,
  isTextArea = false,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputStyle = `w-full rounded-xl border ${
    error ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]" : "border-[var(--border-color)] focus:border-[#D4AF37]"
  } bg-[var(--bg-page)]/50 px-4.5 py-3.5 text-xs text-[var(--text-primary)] outline-none placeholder-gray-500 transition-all duration-180 focus:ring-2 focus:ring-[#D4AF37]/20 ${
    icon ? "pl-11" : ""
  }`;

  return (
    <div className="space-y-1.5 text-left w-full">
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--text-secondary)]">
            <MaterialIcon name={icon} className="text-base" />
          </span>
        )}
        {isTextArea ? (
          <textarea
            id={id}
            className={`${inputStyle} resize-none min-h-[100px] ${className}`}
            {...(props as any)}
          />
        ) : (
          <input
            id={id}
            className={`${inputStyle} ${className}`}
            {...props}
          />
        )}
      </div>
      {error && (
        <span className="text-[10px] text-[#EF4444] font-medium block">
          {error}
        </span>
      )}
    </div>
  );
}

// Portal Component (Targeting document.body to avoid clipping inside templates)
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}

// Modal Component (Wrapped in Portal)
interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-2xl overflow-hidden transition-all text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer focus:outline-none"
        >
          <MaterialIcon name="close" className="text-xl" />
        </button>
        <h3 className="font-display text-base font-black tracking-tight text-[var(--text-primary)] mb-6">
          {title}
        </h3>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "brand";
  children?: React.ReactNode;
}

export function Badge({ variant = "info", children }: BadgeProps) {
  const styles = {
    success: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25",
    info: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25",
    brand: "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25"
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
}

// Avatar Component
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "none";
}

export function Avatar({ src, name, size = "md", status = "none" }: AvatarProps) {
  const sizes = {
    sm: "h-6.5 w-6.5 text-[10px] rounded-lg",
    md: "h-9 w-9 text-xs rounded-xl",
    lg: "h-14 w-14 text-sm rounded-2xl"
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} object-cover bg-[var(--bg-elevated)] border border-[var(--border-color)]`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`${sizes[size]} bg-[var(--bg-elevated)] text-[#D4AF37] font-display font-black border border-[#D4AF37]/20 flex items-center justify-center`}>
          {initial}
        </div>
      )}
      {status !== "none" && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-page)] ${
            status === "online" ? "bg-[#10B981]" : "bg-gray-500"
          }`}
        />
      )}
    </div>
  );
}

// Panel Component (Replaces generic cards)
interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  children?: React.ReactNode;
}

export function Panel({ children, hoverable = false, className = "", ...props }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-xl p-6 ${
        hoverable ? "hover:border-[#D4AF37]/25 transition-all duration-200" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Skeleton Loader
interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "text" | "avatar" | "card" | "table" | "chat" | "profile" | "dashboard";
}

export function SkeletonLoader({ type = "text", className = "", ...props }: SkeletonLoaderProps) {
  const baseClass = "bg-[var(--text-primary)]/5 animate-pulse rounded";

  if (type === "avatar") {
    return <div className={`h-9 w-9 rounded-xl bg-[var(--text-primary)]/5 animate-pulse shrink-0 ${className}`} {...props} />;
  }

  if (type === "card") {
    return (
      <div className={`p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-4 ${className}`} {...props}>
        <div className="h-4 w-1/3 bg-[var(--text-primary)]/10 rounded animate-pulse" />
        <div className="h-10 w-full bg-[var(--text-primary)]/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={`space-y-3.5 p-4 ${className}`} {...props}>
        <div className="h-6 w-full bg-[var(--text-primary)]/10 rounded animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 w-1/4 bg-[var(--text-primary)]/5 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-[var(--text-primary)]/5 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-[var(--text-primary)]/5 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-[var(--text-primary)]/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className={`space-y-4 p-4 ${className}`} {...props}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="h-8.5 w-8.5 rounded-lg bg-[var(--text-primary)]/10 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 bg-[var(--text-primary)]/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-[var(--text-primary)]/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className={`flex gap-4 p-6 items-center ${className}`} {...props}>
        <div className="h-20 w-20 rounded-3xl bg-[var(--text-primary)]/10 animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 bg-[var(--text-primary)]/10 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-[var(--text-primary)]/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className={`grid gap-6 md:grid-cols-3 p-6 ${className}`} {...props}>
        <div className="h-32 bg-[var(--text-primary)]/5 rounded-2xl animate-pulse" />
        <div className="h-32 bg-[var(--text-primary)]/5 rounded-2xl animate-pulse" />
        <div className="h-32 bg-[var(--text-primary)]/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return <div className={`${baseClass} h-4 w-full ${className}`} {...props} />;
}

// Empty State Component
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: string;
}

export function EmptyState({ title, description, icon = "folder_open" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-page)]/50 my-4">
      <MaterialIcon name={icon} className="text-3xl text-[var(--text-secondary)]/60 mb-3" />
      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1 uppercase tracking-wide">{title}</h4>
      <p className="text-[11px] max-w-xs leading-normal">{description}</p>
    </div>
  );
}
