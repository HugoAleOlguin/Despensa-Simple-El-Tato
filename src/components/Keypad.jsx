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
        <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200">

            {/* DISPLAY MEJORADO */}
            <div className="bg-slate-900 p-8 flex flex-col items-end justify-center h-40 transition-colors duration-200 relative">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Monto a Ingresar</span>
                <div className="text-6xl font-black text-white tracking-tighter tabular-nums">
                    {displayValue}
                </div>
                {/* Indicador sutil de Enter para Venta */}
                {input && (
                    <div className="absolute bottom-4 right-8 text-emerald-400 text-xs font-bold animate-pulse">
                        Presiona ENTER para VENTA
                    </div>
                )}
            </div>

            {/* NUMERIC GRID */}
            <div className="flex-1 grid grid-cols-3 gap-2 p-3 bg-slate-50">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                    <button
                        key={num}
                        onClick={() => handleNum(num.toString())}
                        className={getBtnClass(num.toString(), "bg-white text-4xl font-bold text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-all rounded-xl shadow-sm border-b-4 border-slate-200 active:border-b-0 active:translate-y-1")}
                    >
                        {num}
                    </button>
                ))}

                {/* Fila 0 */}
                <button onClick={handleBack} className={getBtnClass('backspace', "bg-red-50 text-red-600 hover:bg-red-100 border-b-4 border-red-100 active:border-b-0 active:translate-y-1 flex items-center justify-center rounded-xl")}>
                    <Delete size={36} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleNum('0')} className={getBtnClass('0', "bg-white text-4xl font-bold text-slate-800 hover:bg-slate-100 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 rounded-xl")}>0</button>
                <button onClick={() => handleNum('00')} className="bg-slate-200 text-2xl font-bold text-slate-600 hover:bg-slate-300 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 rounded-xl">00</button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 pt-0 pb-4">

                <button
                    onClick={() => submit('SALIDA')}
                    title="Atajo: Tecla S"
                    className={getBtnClass('s', "bg-orange-100 text-orange-700 hover:bg-orange-200 py-6 flex flex-col items-center justify-center gap-1 rounded-xl border-b-4 border-orange-200 active:border-b-0 active:translate-y-1 transition-all")}
                >
                    <Wallet size={32} strokeWidth={2.5} />
                    <span className="font-bold text-base">SALIDA (S)</span>
                </button>

                <button
                    onClick={() => submit('FIADO')}
                    title="Atajo: Tecla F"
                    className={getBtnClass('f', "bg-red-100 text-red-700 hover:bg-red-200 py-6 flex flex-col items-center justify-center gap-1 rounded-xl border-b-4 border-red-200 active:border-b-0 active:translate-y-1 transition-all")}
                >
                    <UserMinus size={32} strokeWidth={2.5} />
                    <span className="font-bold text-base">FIADO (F)</span>
                </button>

                <button
                    onClick={() => submit('VENTA')}
                    title="Atajo: ENTER"
                    className={getBtnClass('enter', "bg-emerald-500 text-white hover:bg-emerald-600 py-6 flex flex-col items-center justify-center gap-1 rounded-xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg transition-all")}
                >
                    <ShoppingBag size={36} strokeWidth={2.5} />
                    <span className="font-black text-xl tracking-wide">VENTA ↵</span>
                </button>

            </div>
        </div>
    );
};

export default Keypad;
