import React from 'react';
import { Calculator, Users, History } from 'lucide-react';

const BottomNav = ({ activeView, onViewChange }) => {
    const items = [
        { id: 'POS', icon: Calculator, label: 'CAJA' },
        { id: 'DEBT', icon: Users, label: 'DEUDAS' },
        { id: 'HISTORY', icon: History, label: 'HIST' },
    ];

    return (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 p-2 pb-safe fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
            {items.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`flex flex-col items-center justify-center p-1 rounded-xl w-24 ${isActive
                            ? 'text-emerald-400 bg-emerald-900/20'
                            : 'text-slate-500 active:text-slate-300'
                            }`}
                    >
                        <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5" />
                        <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;
