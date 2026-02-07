import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, User, Search, Check, AlertCircle, Plus } from 'lucide-react';

const DebtModal = ({ isOpen, onClose, amount, onSubmit }) => {
    if (!isOpen) return null;

    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [detail, setDetail] = useState('');

    // Create New Logic
    const [isCreating, setIsCreating] = useState(false);

    const searchInputRef = useRef(null);
    const detailInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedClient(null);
            setDetail('');
            setIsCreating(false);
            fetch('http://localhost:3001/api/clientes')
                .then(res => res.json())
                .then(data => setClients(data));

            // setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Filter logic: If empty, show recent (all sorted by backend). Else filter.
    const filteredClients = searchTerm
        ? clients.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        : clients;

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setIsCreating(false);
        // Focus detail
        // setTimeout(() => detailInputRef.current?.focus(), 50);
    };

    const handleCreateRequest = () => {
        setSelectedClient(null);
        setIsCreating(true);
        // setTimeout(() => detailInputRef.current?.focus(), 50);
    }

    const handleSubmit = () => {
        if (!isCreating && !selectedClient) return alert("Selecciona un vecino o crea uno nuevo");
        if (isCreating && !searchTerm.trim()) return alert("Escribe un nombre");

        const payload = {
            monto: amount,
            detalle: detail,
            crear_cliente: isCreating,
            cliente_id: selectedClient?.id,
            nombre_nuevo: searchTerm // If creating, use the search term as name
        };
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-800">

                {/* HEADER */}
                <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-200">Anotar Cuenta</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-bold uppercase text-xs">Total a anotar:</span>
                            <span className="text-red-500 font-black text-2xl">${amount}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* STEP 1: WHO? */}
                    <div className={`space-y-4 transition-all duration-300 ${selectedClient || isCreating ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <User size={14} /> 1. ¿Quién es?
                        </label>

                        <div className="relative group">
                            <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={24} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar vecino..."
                                className="w-full bg-slate-800 p-4 pl-14 rounded-2xl font-bold text-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:bg-slate-800 border-2 border-transparent focus:border-emerald-500 transition-all placeholder:text-slate-600 text-slate-200"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setSelectedClient(null); // Reset selection on typing
                                    setIsCreating(false);
                                }}
                            />
                        </div>

                        {/* RESULTS LIST */}
                        {(!selectedClient && !isCreating) && (
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {/* EXISTING MATCHES */}
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {filteredClients.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleClientSelect(c)}
                                            className="w-full text-left p-4 hover:bg-slate-700 border-b border-slate-700 last:border-0 flex justify-between items-center group transition-colors"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-200 text-lg group-hover:text-emerald-400">{c.nombre}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Debía: ${c.deuda_actual}</p>
                                            </div>
                                            <div className="bg-slate-900 group-hover:bg-emerald-900/50 text-slate-600 group-hover:text-emerald-400 p-2 rounded-full transition-colors">
                                                <Check size={20} />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* CREATE NEW OPTION - VISIBLE IF SEARCHING */}
                                {searchTerm.length > 0 && (
                                    <button
                                        onClick={handleCreateRequest}
                                        className="w-full p-4 bg-emerald-900/20 hover:bg-emerald-900/40 text-left flex items-center gap-3 transition-colors border-t border-emerald-900/30"
                                    >
                                        <div className="bg-emerald-600 text-white p-2 rounded-full shadow-sm">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-400 text-lg">Crear Nuevo: "{searchTerm}"</p>
                                            <p className="text-xs text-emerald-600 font-medium">No encontré a nadie, regístralo.</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SELECTION FEEDBACK */}
                    {(selectedClient || isCreating) && (
                        <div className="animate-in zoom-in-95 duration-200">
                            <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-600 p-2 rounded-full">
                                        {isCreating ? <UserPlus size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">{isCreating ? 'Creando Nuevo Cliente' : 'Cliente Seleccionado'}</p>
                                        <p className="font-bold text-xl">{isCreating ? searchTerm : selectedClient.nombre}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedClient(null); setIsCreating(false); /* setTimeout(() => searchInputRef.current?.focus(), 50); */ }}
                                    className="text-slate-400 hover:text-white text-xs font-bold underline"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DETAILS */}
                    <div className={`space-y-4 transition-all duration-300 ${!selectedClient && !isCreating ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                        <hr className="border-slate-800" />
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <AlertCircle size={14} /> 2. ¿Qué lleva? (Opcional)
                        </label>
                        <input
                            ref={detailInputRef}
                            type="text"
                            placeholder="Ej: Pan, Coca, Cigarrillos..."
                            className="w-full bg-slate-800 p-4 rounded-2xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/20 border-2 border-transparent focus:border-emerald-500 transition-all text-slate-200 placeholder:text-slate-600"
                            value={detail}
                            onChange={e => setDetail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>

                </div>

                {/* FOOTER ACTION */}
                <div className="p-6 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedClient && !isCreating}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        CONFIRMAR Y GUARDAR
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DebtModal;
