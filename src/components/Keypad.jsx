import React, { useEffect, useCallback } from 'react';
import { Delete } from 'lucide-react';

const Keypad = ({ onInput }) => {

    // Mapeo teclado físico
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (!e.key) return;
            const key = e.key;

            if (/^[0-9]$/.test(key)) {
                onInput(key);
                return;
            }
            if (key === 'Backspace') {
                onInput('DEL');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onInput]);

    return (
        <div className="flex-1 w-full max-w-sm mx-auto p-2">
            <div className="flex flex-wrap h-64 md:h-80 gap-2 content-center justify-center">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                    <button
                        key={num}
                        onClick={() => onInput(num.toString())}
                        className="w-[30%] h-[22%] bg-slate-800 text-3xl font-bold text-slate-200 active:bg-slate-700 rounded-xl shadow-sm border-b-4 border-slate-950 active:border-b-0 flex items-center justify-center"
                    >
                        {num}
                    </button>
                ))}

                {/* Fila 0 */}
                <button
                    onClick={() => onInput('00')}
                    className="w-[30%] h-[22%] bg-slate-800 text-xl font-bold text-slate-400 active:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 rounded-xl flex items-center justify-center"
                >
                    00
                </button>
                <button
                    onClick={() => onInput('0')}
                    className="w-[30%] h-[22%] bg-slate-800 text-3xl font-bold text-slate-200 active:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 rounded-xl flex items-center justify-center"
                >
                    0
                </button>

                {/* Backspace */}
                <button
                    onClick={() => onInput('DEL')}
                    className="w-[30%] h-[22%] bg-red-900/30 text-red-500 active:bg-red-900/50 border-b-4 border-red-900/50 active:border-b-0 flex items-center justify-center rounded-xl"
                >
                    <Delete size={28} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default Keypad;

