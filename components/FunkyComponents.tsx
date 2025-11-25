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
    "relative overflow-hidden transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold tracking-tight select-none border-2";

  const variants = {
    primary:
      "w-full bg-black text-white border-black hover:bg-[var(--color-neon-green)] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px]",
    secondary:
      "w-full bg-white text-black border-black hover:bg-gray-50 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
    icon:
      "p-2 bg-transparent border-transparent hover:bg-gray-100 text-black transition-colors",
    danger:
      "w-full bg-white text-red-600 border-black hover:bg-red-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
  };

  const pulseVariants = {
    primary:
      "w-full bg-[var(--color-neon-green)] text-black border-black",
    secondary: "bg-black text-white border-black",
    icon: "bg-[var(--color-neon-green)]",
    danger: "bg-red-800"
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
      ? "rgba(204, 255, 0, 0.5)"
      : variant === "secondary"
        ? "rgba(0,0,0,0.1)"
        : "rgba(0,0,0,0.1)";

  return (
    <motion.button
      type={type || "button"}
      className={`${baseStyle} ${visualVariant} ${className} py-4`}
      disabled={isLoading || rest.disabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      whileHover={{ scale: rest.disabled ? 1 : 1.02 }}
      whileTap={{ scale: rest.disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17, mass: 1 }}
      animate={pulsing ? { scale: [1, 1.02, 1] } : {}}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2">
        {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
        {label}
      </span>

      {liquidWaveOnClick && pulsing && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ y: "100%" }}
          animate={{ y: "-100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ background: waveColor }}
        />
      )}
    </motion.button>
  );
};

export const FunkyCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border-2 border-black p-5 ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} ${className}`}
  >
    {children}
  </div>
);

export const FunkyInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input
    className={`w-full border-2 border-black px-5 py-4 text-base bg-white text-black placeholder-gray-500 focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all ${className}`}
    {...props}
  />
);

export const FunkyBadge: React.FC<{ children: React.ReactNode; color?: 'teal' | 'indigo' | 'rose' | 'slate' | 'gray' }> = ({ children, color = 'indigo' }) => {
  const colors: Record<string, string> = {
    teal: "bg-teal-200 text-black border-2 border-black",
    indigo: "bg-indigo-200 text-black border-2 border-black",
    rose: "bg-rose-200 text-black border-2 border-black",
    slate: "bg-gray-200 text-black border-2 border-black",
    gray: "bg-gray-200 text-black border-2 border-black"
  };

  return (
    <span className={`px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider ${colors[color] || colors.indigo}`}>
      {children}
    </span>
  );
};

export const FunkyToast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce-in pointer-events-none w-full max-w-xs px-4 text-center">
      <div className="bg-black text-[var(--color-neon-green)] px-6 py-4 shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] border-2 border-[var(--color-neon-green)] flex items-center justify-center gap-3 font-bold uppercase tracking-widest">
        <span className="text-xl">📢</span> {message}
      </div>
    </div>
  );
};
