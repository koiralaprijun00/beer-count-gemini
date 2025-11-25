import React from 'react';

interface NavItemProps {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    desktop?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({ active, icon, label, onClick, desktop }) => (
    <button
        onClick={onClick}
        className={`
      transition-all duration-200 flex items-center gap-2 group border-2 border-transparent
      ${desktop
                ? `px-4 py-2 font-bold text-sm uppercase tracking-wider ${active ? 'text-black' : 'text-gray-500 hover:text-black'}`
                : `flex-col justify-center w-full py-3 relative ${active ? 'text-black' : 'text-gray-400 hover:text-black'}`
            }
    `}
    >
        <div className={`relative ${!desktop && active ? '-translate-y-1 transition-transform duration-300' : ''} ${active ? 'text-[var(--color-neon-green)]' : ''}`}>
            {icon}
        </div>
        {desktop && <span>{label}</span>}
    </button>
);
