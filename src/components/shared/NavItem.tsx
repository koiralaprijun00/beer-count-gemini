import React from 'react';
import { useHaptic } from '../../hooks/useHaptic';

interface NavItemProps {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    desktop?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({ active, icon, label, onClick, desktop }) => {
    const { trigger } = useHaptic();

    const handleClick = () => {
        trigger('light');
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`
      transition-all duration-300 flex items-center justify-center group
      ${desktop
                    ? `px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-transparent rounded-xl gap-2 ${active ? 'text-slate-900 bg-slate-100/80 border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'}`
                    : `w-12 h-12 rounded-full ${active
                        ? 'bg-[var(--color-neon-green)] text-black shadow-[0_0_15px_rgba(204,255,0,0.4)] scale-110'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`
                }
    `}
        >
            <div
                className={`relative transition-transform duration-300 ${active && !desktop ? 'scale-110' : ''} group-hover:scale-110`}
            >
                {icon}
            </div>
            {desktop && <span>{label}</span>}
        </button>
    );
};
