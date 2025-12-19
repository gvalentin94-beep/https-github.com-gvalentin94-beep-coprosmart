
import React from 'react';

// Button Component
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'destructive' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

export function Button({ children, variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-sm",
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
  return <h2 className={`font-bold text-lg text-white ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: CardChildProps) {
    return <p className={`text-sm text-slate-400 font-light ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: CardChildProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

// Form Components
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-slate-700 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-normal ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full border border-slate-700 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] transition font-normal ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full border border-slate-700 rounded-lg px-3 py-2 text-base md:text-sm shadow-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-normal ${className}`}
      {...props}
    >
        {children}
    </select>
  );
}

export function Label({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-xs font-semibold tracking-wide text-slate-400 block mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

// Badge Component
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
  children?: React.ReactNode;
  className?: string;
  color?: string;
}

export function Badge({ children, variant, className = "", color }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap tracking-wide";
  
  let variantClasses = "";
  if (color) {
      const colorMap: { [key: string]: string } = {
          amber: 'bg-amber-500 text-slate-900',
          indigo: 'bg-indigo-600 text-white',
          sky: 'bg-sky-500 text-white',
          emerald: 'bg-emerald-600 text-white',
          rose: 'bg-rose-600 text-white',
          fuchsia: 'bg-fuchsia-600 text-white',
      };
      variantClasses = colorMap[color] || "bg-slate-700 text-white";
  } else {
      variantClasses = {
        default: "bg-indigo-600 text-white",
        secondary: "bg-slate-700 text-slate-200",
        outline: "border border-slate-600 text-slate-400 bg-transparent",
        destructive: "bg-rose-600 text-white",
        success: "bg-emerald-600 text-white",
      }[variant || 'default'];
  }

  return <span className={`${baseClasses} ${variantClasses} ${className}`}>{children}</span>;
}

// Section Component
export function Section({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </section>
  );
}
