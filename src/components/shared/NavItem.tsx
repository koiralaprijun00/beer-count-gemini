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
      transition-all duration-200 flex items-center gap-2 group border-2 border-transparent rounded-xl
      ${desktop
                    ? `px-4 py-2 font-bold text-sm uppercase tracking-wider ${active ? 'text-slate-900 bg-slate-100/80 border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'}`
                    : `flex-col justify-center w-full py-6 relative ${active ? 'text-slate-900 bg-slate-100/80 border-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'}`
                }
    `}
        >
            <div
                className={`relative transition-transform duration-300 ${!desktop && active ? '-translate-y-1' : ''} ${active ? 'text-slate-900' : ''} group-hover:scale-105 group-hover:text-slate-900`}
            >
                {icon}
            </div>
            {desktop && <span>{label}</span>}
        </button>
    );
};
