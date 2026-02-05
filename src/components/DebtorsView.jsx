import React, { useState, useEffect } from 'react';
import { User, ChevronRight, DollarSign, Calendar } from 'lucide-react';

const DebtorsView = ({ onSelectClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = `http://${window.location.hostname}:3001`;
        fetch(`${API_URL}/api/clientes`)
            .then(res => res.json())
            .then(data => {
                setClients(data); // Save all
                setLoading(false);
            });
    }, []);

    const debtors = clients.filter(c => c.deuda_actual > 0).sort((a, b) => b.deuda_actual - a.deuda_actual);
    const inCredit = clients.filter(c => c.deuda_actual < 0).sort((a, b) => a.deuda_actual - b.deuda_actual); // Most negative (credit) first
    const clean = clients.filter(c => c.deuda_actual === 0);

    const totalDeuda = clients.reduce((acc, c) => acc + c.deuda_actual, 0);

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando vecinos...</div>;

    const ListItem = ({ client }) => (
        <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:bg-slate-50 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold relative ${client.deuda_actual > 0 ? 'bg-red-100 text-red-600' : (client.deuda_actual < 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}`}>
                    {client.nombre.charAt(0).toUpperCase()}
                    {client.deuda_actual < 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>}
                </div>
                <div className="text-left">
                    <p className="font-bold text-slate-800">{client.nombre}</p>
                    <p className="text-xs text-slate-400">Tel: {client.telefono || '-'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {client.deuda_actual !== 0 && (
                    <span className={`font-bold text-lg ${client.deuda_actual > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {client.deuda_actual > 0 ? `$${client.deuda_actual}` : `+ $${Math.abs(client.deuda_actual)}`}
                    </span>
                )}
                {client.deuda_actual === 0 && <span className="text-xs font-bold text-slate-300 uppercase bg-slate-100 px-2 py-1 rounded-lg">Al día</span>}
                <ChevronRight className="text-slate-300 group-hover:text-slate-500" />
            </div>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">

            {/* SUMMARY CARD */}
            <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center mb-2">
                <div>
                    <p className="text-xs uppercase font-bold text-slate-400">Balance General Deudas</p>
                    <h2 className={`text-3xl font-black ${totalDeuda > 0 ? 'text-red-600' : 'text-emerald-600'}`}>${totalDeuda}</h2>
                </div>
                <div className="bg-slate-50 p-3 rounded-full text-slate-400">
                    <User size={32} />
                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

                {/* SECTION: DEBTORS */}
                {debtors.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider px-2">Deben</h3>
                        {debtors.map(c => <ListItem key={c.id} client={c} />)}
                    </div>
                )}

                {/* SECTION: IN CREDIT (A FAVOR) */}
                {inCredit.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider px-2">Saldo a Favor</h3>
                        {inCredit.map(c => <ListItem key={c.id} client={c} />)}
                    </div>
                )}

                {/* DIVIDER */}
                {clean.length > 0 && (
                    <div className="border-t border-slate-200 my-4 flex items-center justify-center">
                        <span className="bg-slate-50 px-2 text-xs text-slate-400 uppercase font-bold">Sin Deuda</span>
                    </div>
                )}


                {/* SECTION: CLEAN */}
                <div className="space-y-2 opacity-70">
                    {clean.map(c => <ListItem key={c.id} client={c} />)}
                </div>

                {clients.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No hay vecinos registrados.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DebtorsView;
