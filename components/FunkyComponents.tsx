import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "icon" | "danger";
  isLoading?: boolean;
  pulseOnClick?: boolean;
  pressText?: React.ReactNode;
  pulseDurationMs?: number;
  liquidWaveOnClick?: boolean;
}

// THEME: Indigo & Violet & Teal
// Primary: Indigo-600
// Secondary Accents: Teal-400, Violet-500

export const FunkyButton: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading,
  pulseOnClick = false,
  pressText,
  pulseDurationMs = 650,
  liquidWaveOnClick = true,
  className = "",
  onClick,
  onMouseDown,
  onTouchStart,
  type,
  ...rest
}) => {
  const [pulsing, setPulsing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const baseStyle =
    "relative overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold tracking-tight select-none";

  const variants = {
    primary:
      "w-full rounded-xl bg-gray-800 text-white py-3 px-6 shadow-md shadow-gray-900/20 hover:bg-gray-700 hover:shadow-gray-900/30",
    secondary:
      "w-full rounded-xl border-2 border-gray-200 text-gray-600 py-3 px-6 bg-white hover:border-gray-300 hover:text-gray-800 hover:bg-gray-50",
    icon:
      "p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors",
    danger:
      "w-full rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
  };

  const pulseVariants = {
    primary:
      "w-full rounded-xl bg-gray-600 text-white py-3 px-6 shadow-md shadow-gray-800/30",
    secondary: "bg-gray-100 border-gray-300 text-gray-800",
    icon: "bg-gray-100",
    danger: "bg-red-100"
  };

  const triggerPulse = () => {
    if (!pulseOnClick && !liquidWaveOnClick) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPulsing(true);
    timerRef.current = window.setTimeout(() => setPulsing(false), pulseDurationMs);
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    triggerPulse();
    onClick?.(e);
  };

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    triggerPulse();
    onMouseDown?.(e);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLButtonElement> = (e) => {
    triggerPulse();
    onTouchStart?.(e);
  };

  const label = pulsing && pressText ? pressText : children;
  const visualVariant =
    pulsing && pulseVariants[variant] ? pulseVariants[variant] : variants[variant];

  const waveColor =
    variant === "primary"
      ? "rgba(255,255,255,0.35)"
      : variant === "secondary"
        ? "rgba(79,70,229,0.12)"
        : "rgba(79,70,229,0.12)";

  return (
    <motion.button
      type={type || "button"}
      className={`${baseStyle} ${visualVariant} ${className}`}
      disabled={isLoading || rest.disabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      whileHover={!rest.disabled && !isLoading ? { y: -2, scale: 1.02 } : {}}
      whileTap={!rest.disabled && !isLoading ? { scale: 0.94 } : {}}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.6,
      }}
      animate={pulsing ? { scale: [1, 1.05, 0.98, 1] } : { scale: 1 }}
      {...rest}
    >
      {liquidWaveOnClick && (
        <motion.div
          className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
          initial={{ height: 0, opacity: 0 }}
          animate={
            pulsing
              ? { height: ["0%", "55%", "0%"], opacity: [0, 1, 0] }
              : { height: "0%", opacity: 0 }
          }
          transition={{ duration: 0.65, ease: "easeInOut" }}
          style={{ background: waveColor }}
        >
          <motion.svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="absolute top-0 left-0 w-[200%] h-8"
            initial={{ x: 0 }}
            animate={pulsing ? { x: ["0%", "-50%"] } : { x: "0%" }}
            transition={{ duration: 0.65, ease: "linear" }}
          >
            <path
              d="M0,40 C150,90 350,0 600,40 C850,80 1050,10 1200,40 L1200,120 L0,120 Z"
              fill={waveColor}
            />
          </motion.svg>
        </motion.div>
      )}

      <div className="relative z-10 flex items-center gap-2 whitespace-nowrap pointer-events-none">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        <motion.span
          initial={{ y: 4 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {label}
        </motion.span>
      </div>
    </motion.button>
  );
};

export const FunkyCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${onClick ? '' : ''} ${className}`}
  >
    {children}
  </div>
);

export const FunkyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all shadow-sm ${className}`}
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
