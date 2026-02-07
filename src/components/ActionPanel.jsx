import React from 'react';
import { ShoppingBag, UserMinus, Wallet } from 'lucide-react';

const ActionPanel = ({ onAction, disabled }) => {
    return (
        <div className="grid grid-cols-3 gap-2 p-2">
            {/* GASTO */}
            <button
                onClick={() => onAction('SALIDA')}
                disabled={disabled}
                className="bg-orange-900/30 active:bg-orange-900/50 text-orange-500 border border-orange-900/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg h-24"
            >
                <Wallet size={24} strokeWidth={2.5} />
                <span className="font-bold text-xs">GASTO</span>
            </button>

            {/* FIADO */}
            <button
                onClick={() => onAction('FIADO')}
                disabled={disabled}
                className="bg-red-900/30 active:bg-red-900/50 text-red-500 border border-red-900/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg h-24"
            >
                <UserMinus size={24} strokeWidth={2.5} />
                <span className="font-bold text-xs">FIADO</span>
            </button>

            {/* COBRAR (Principal) */}
            <button
                onClick={() => onAction('VENTA')}
                disabled={disabled}
                className="bg-emerald-600 active:bg-emerald-500 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-emerald-900/50 shadow-lg h-24 border-b-4 border-emerald-800 active:border-b-0"
            >
                <ShoppingBag size={32} strokeWidth={3} />
                <span className="font-black text-sm tracking-widest">COBRAR</span>
            </button>
        </div>
    );
};

export default ActionPanel;
