import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'danger';
  isLoading?: boolean;
}

// THEME: Indigo & Violet & Teal
// Primary: Indigo-600
// Secondary Accents: Teal-400, Violet-500

export const FunkyButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold tracking-tight";
  
  const variants = {
    primary: "w-full rounded-xl bg-indigo-600 text-white py-3 px-6 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-600/40",
    secondary: "w-full rounded-xl border-2 border-slate-200 text-slate-600 py-3 px-6 bg-white hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50",
    icon: "p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors",
    danger: "w-full rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const FunkyCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-300' : ''} ${className}`}
  >
    {children}
  </div>
);

export const FunkyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    className="w-full rounded-xl border-2 border-slate-100 px-5 py-4 text-base bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
    {...props}
  />
);

export const FunkyBadge: React.FC<{ children: React.ReactNode; color?: 'teal' | 'indigo' | 'rose' | 'slate' }> = ({ children, color = 'indigo' }) => {
  const colors = {
    teal: "bg-teal-50 text-teal-700 border border-teal-100",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    rose: "bg-rose-50 text-rose-700 border border-rose-100",
    slate: "bg-slate-100 text-slate-600 border border-slate-200"
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

export const FunkyToast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
    if (!visible) return null;
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce-in pointer-events-none w-full max-w-xs px-4 text-center">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center gap-3 font-semibold">
                <span className="text-xl">🎉</span> {message}
            </div>
        </div>
    )
}