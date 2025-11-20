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
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-sm shadow-indigo-900/20",
    outline: "border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 focus-visible:ring-indigo-500",
    destructive: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-indigo-500",
    secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600 focus-visible:ring-indigo-500",
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
  children?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md';
  key?: React.Key;
}

export function Card({ children, className = "", padding = 'md' }: CardProps) {
  const paddingClass = {
      md: "",
      sm: "p-0",
      none: "p-0",
  }[padding];
  return (
    <div className={`border border-slate-700 rounded-xl bg-slate-800 shadow-xl text-slate-200 ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

interface CardChildProps {
  children?: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardChildProps) {
  return <div className={`px-5 pt-4 pb-3 border-b border-slate-700 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardChildProps) {
  return <h2 className={`font-bold text-lg text-white tracking-tight ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: CardChildProps) {
    return <p className={`text-sm text-slate-400 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: CardChildProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

// Form Components - Updated to White Background / Dark Text
// Modified Input to use text-base on mobile (prevents iOS zoom) and text-sm on desktop
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] transition ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${className}`}
      {...props}
    >
        {children}
    </select>
  );
}

export function Label({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-xs font-medium text-slate-400 block ${className}`} {...props}>
      {children}
    </label>
  );
}

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
  children?: React.ReactNode;
  className?: string;
  color?: string; // For dynamic colors
}

export function Badge({ children, variant, className = "", color }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border";
  
  let variantClasses = "";
  if (color) {
      // Dark mode colors: darker background, lighter text
      const colorMap: { [key: string]: string } = {
          amber: 'bg-amber-900/30 text-amber-200 border-amber-800',
          indigo: 'bg-indigo-900/30 text-indigo-200 border-indigo-800',
          sky: 'bg-sky-900/30 text-sky-200 border-sky-800',
          emerald: 'bg-emerald-900/30 text-emerald-200 border-emerald-800',
          rose: 'bg-rose-900/30 text-rose-200 border-rose-800',
          fuchsia: 'bg-fuchsia-900/30 text-fuchsia-200 border-fuchsia-800',
      };
      variantClasses = colorMap[color] || "bg-slate-800 text-slate-300 border-slate-700";
  } else {
      variantClasses = {
        default: "bg-indigo-900/50 text-indigo-100 border-indigo-700",
        secondary: "bg-slate-800 text-slate-300 border-slate-700",
        outline: "border-slate-600 text-slate-400 bg-transparent",
        destructive: "bg-rose-900/50 text-rose-200 border-rose-800",
        success: "bg-emerald-900/50 text-emerald-200 border-emerald-800",
      }[variant || 'default'];
  }

  return <span className={`${baseClasses} ${variantClasses} ${className}`}>{children}</span>;
}

// Section Component
export function Section({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 ${className}`}>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </section>
  );
}