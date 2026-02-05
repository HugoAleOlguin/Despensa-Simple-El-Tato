import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Wallet, UserMinus, ShoppingBag } from 'lucide-react';

const Keypad = ({ onAction }) => {
    const [input, setInput] = useState('');
    const [activeKey, setActiveKey] = useState(null); // Para efecto visual al presionar tecla física

    const submit = useCallback((tipo) => {
        if (!input && tipo !== 'DELETE') return; // Permitir DELETE vacio (no hace nada) pero bloquear envios vacios
        if (input) {
            onAction(tipo, parseInt(input));
            setInput('');
        }
    }, [input, onAction]);

    const handleNum = useCallback((num) => {
        if (input.length > 8) return;
        setInput(prev => prev + num);
    }, [input]);

    const handleBack = useCallback(() => {
        setInput(prev => prev.slice(0, -1));
    }, []);

    // Manejo de Teclado Físico
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignorar si el foco está en un input de texto (ej: modal)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key;

            // Feedback Visual
            setActiveKey(key.toLowerCase());
            setTimeout(() => setActiveKey(null), 150);

            // Numeros (0-9)
            if (/^[0-9]$/.test(key)) {
                handleNum(key);
                return;
            }

            // Backspace
            if (key === 'Backspace') {
                handleBack();
                return;
            }

            // Atajos de Acción
            if (key === 'Enter') {
                e.preventDefault();
                submit('VENTA');
            }
            if (key.toLowerCase() === 'f') {
                submit('FIADO');
            }
            if (key.toLowerCase() === 's') {
                submit('SALIDA');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNum, handleBack, submit]);

    // Format display as currency
    const displayValue = input ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(input) : '$0';

    // Helper para clases de botones activos
    const getBtnClass = (triggerKey, baseClass) => {
        const isActive = activeKey === triggerKey || (triggerKey === 'enter' && activeKey === 'Enter');
        return `${baseClass} ${isActive ? 'ring-4 ring-opacity-50 ring-slate-400 transform scale-95' : ''}`;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-800">

            {/* DISPLAY */}
            <div className="bg-slate-950 p-4 flex flex-col items-end justify-center h-28 shrink-0 relative border-b border-slate-800">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Monto a Ingresar</span>
                <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
                    {displayValue}
                </div>
                {/* Indicador sutil de Enter para Venta */}
                {input && (
                    <div className="absolute bottom-2 right-4 text-emerald-400 text-xs font-bold animate-pulse">
                        ENTER = VENTA
                    </div>
                )}
            </div>

            {/* NUMERIC AREA - Usando FLEX en lugar de GRID para compatibilidad J2 Prime */}
            <div className="flex-1 bg-slate-900 p-1">
                <div className="flex flex-wrap h-full">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                        <div key={num} className="w-1/3 h-1/5 p-1">
                            <button
                                onClick={() => handleNum(num.toString())}
                                className={getBtnClass(num.toString(), "w-full h-full bg-slate-800 text-3xl font-bold text-slate-200 hover:bg-slate-700 active:bg-slate-600 transition-all rounded-xl shadow-sm border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 flex items-center justify-center")}
                            >
                                {num}
                            </button>
                        </div>
                    ))}

                    {/* Fila 0 */}
                    <div className="w-1/3 h-1/5 p-1">
                        <button onClick={() => handleNum('00')} className="w-full h-full bg-slate-700 text-xl font-bold text-slate-400 hover:bg-slate-600 border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 rounded-xl flex items-center justify-center">00</button>
                    </div>
                    <div className="w-1/3 h-1/5 p-1">
                        <button onClick={() => handleNum('0')} className={getBtnClass('0', "w-full h-full bg-slate-800 text-3xl font-bold text-slate-200 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 rounded-xl flex items-center justify-center")}>0</button>
                    </div>
                    <div className="w-1/3 h-1/5 p-1">
                        <button onClick={handleBack} className={getBtnClass('backspace', "w-full h-full bg-red-900/30 text-red-500 hover:bg-red-900/50 border-b-4 border-red-900/50 active:border-b-0 active:translate-y-1 flex items-center justify-center rounded-xl")}>
                            <Delete size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* ACTION BUTTONS ROW (Integrada en el grid flexible para ocupar el resto) */}
                    <div className="w-1/3 h-1/5 p-1">
                        <button
                            onClick={() => submit('SALIDA')}
                            className={getBtnClass('s', "w-full h-full bg-orange-900/40 text-orange-500 hover:bg-orange-900/60 flex flex-col items-center justify-center gap-0 rounded-xl border-b-4 border-orange-900/50 active:border-b-0 active:translate-y-1 transition-all")}
                        >
                            <Wallet size={20} strokeWidth={2.5} />
                            <span className="font-bold text-[10px]">SALIDA</span>
                        </button>
                    </div>

                    <div className="w-1/3 h-1/5 p-1">
                        <button
                            onClick={() => submit('FIADO')}
                            className={getBtnClass('f', "w-full h-full bg-red-900/40 text-red-500 hover:bg-red-900/60 flex flex-col items-center justify-center gap-0 rounded-xl border-b-4 border-red-900/50 active:border-b-0 active:translate-y-1 transition-all")}
                        >
                            <UserMinus size={20} strokeWidth={2.5} />
                            <span className="font-bold text-[10px]">FIADO</span>
                        </button>
                    </div>

                    <div className="w-1/3 h-1/5 p-1">
                        <button
                            onClick={() => submit('VENTA')}
                            className={getBtnClass('enter', "w-full h-full bg-emerald-600 text-white hover:bg-emerald-500 flex flex-col items-center justify-center gap-0 rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg transition-all")}
                        >
                            <ShoppingBag size={24} strokeWidth={2.5} />
                            <span className="font-black text-sm tracking-wide">VENTA</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Keypad;
