
import React from 'react';

// Button Component
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'destructive' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

export function Button({ children, variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-indigo-500",
    destructive: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-indigo-500",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-indigo-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-3",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Card Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md';
}

export function Card({ children, className = "", padding = 'md' }: CardProps) {
  const paddingClass = {
      md: "",
      sm: "p-0",
      none: "p-0",
  }[padding];
  return (
    <div className={`border border-slate-200/80 rounded-xl bg-white shadow-lg shadow-slate-100/70 ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

interface CardChildProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardChildProps) {
  return <div className={`px-5 pt-4 pb-3 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardChildProps) {
  return <h2 className={`font-bold text-lg text-slate-800 tracking-tight ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: CardChildProps) {
    return <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: CardChildProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

// Form Components
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] transition ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${className}`}
      {...props}
    >
        {children}
    </select>
  );
}

export function Label({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-xs font-medium text-slate-600 block ${className}`} {...props}>
      {children}
    </label>
  );
}

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
  children: React.ReactNode;
  className?: string;
  color?: string; // For dynamic colors
}

export function Badge({ children, variant, className = "", color }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";
  
  let variantClasses = "";
  if (color) {
      variantClasses = `bg-${color}-100 text-${color}-800`;
  } else {
      variantClasses = {
        default: "bg-indigo-100 text-indigo-800",
        secondary: "bg-slate-100 text-slate-700",
        outline: "border border-slate-300 text-slate-600 bg-transparent",
        destructive: "bg-rose-100 text-rose-800",
        success: "bg-emerald-100 text-emerald-800",
      }[variant || 'default'];
  }

  return <span className={`${baseClasses} ${variantClasses} ${className}`}>{children}</span>;
}
