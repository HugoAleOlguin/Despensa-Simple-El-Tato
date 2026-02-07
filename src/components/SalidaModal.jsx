import React, { useState, useEffect, useRef } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';

const SalidaModal = ({ isOpen, onClose, amount, onSubmit }) => {
    if (!isOpen) return null;

    const [detail, setDetail] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setDetail('');
            // setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!detail.trim()) return alert("Por favor, escribe en qué se gastó (ej: Proveedor, Limpieza, Retiro)");
        onSubmit(detail);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800 animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-200 flex items-center gap-2">
                            <Wallet className="text-orange-500" /> Registrar Salida
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 font-bold uppercase text-xs">Monto a retirar:</span>
                            <span className="text-orange-500 font-black text-2xl">${amount}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <AlertCircle size={14} /> ¿En qué se gastó?
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ej: Proveedor Coca-Cola, Panadero, Limpieza..."
                            className="w-full bg-slate-800 p-4 rounded-2xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/20 border-2 border-transparent focus:border-orange-500 transition-all text-slate-200 placeholder:text-slate-600"
                            value={detail}
                            onChange={e => setDetail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
                    <button
                        onClick={onClose}
                        className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-900/30 hover:shadow-orange-900/50 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        CONFIRMAR SALIDA
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SalidaModal;
