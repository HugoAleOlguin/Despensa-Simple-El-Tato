import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, Calendar, DollarSign, Plus, Edit2, Save, X } from 'lucide-react';

const ClientDetailView = ({ client, onBack, activeDate }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPayInput, setShowPayInput] = useState(false);
    const [payAmount, setPayAmount] = useState('');

    // Edit Phone Logic
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phone, setPhone] = useState(client.telefono || '');

    const fetchHistory = () => {
        const API_URL = `http://${window.location.hostname}:3001`;
        fetch(`${API_URL}/api/deudores/${client.id}/historial`)
            .then(res => res.json())
            .then(data => {
                setHistory(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        setPhone(client.telefono || '');
        fetchHistory();
    }, [client]);

    const savePhone = async () => {
        try {
            const API_URL = `http://${window.location.hostname}:3001`;
            await fetch(`${API_URL}/api/clientes/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telefono: phone })
            });
            setIsEditingPhone(false);
            // Update local object if needed or just visual
            client.telefono = phone;
        } catch (err) { alert("Error al guardar teléfono"); }
    };

    const handleManualPayment = async () => {
        if (!payAmount) return;
        const amount = parseInt(payAmount);

        try {
            const API_URL = `http://${window.location.hostname}:3001`;
            await fetch(`${API_URL}/api/fiado/pagar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cliente_id: client.id, monto: amount }) // Just logging a generic payment
            });
            setPayAmount('');
            setShowPayInput(false);
            fetchHistory();

            // Emulate back button to refresh parent or we need a way to refresh parent balance display
            // Ideally we should refetch client info in parent, but for now user can go back.
            // Or we can assume optimistic update? Let's just reload history.
        } catch (err) {
            alert("Error al pagar");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">

            {/* HEADER */}
            <div className="bg-white p-4 flex items-center justify-between shadow-sm z-10 border-b border-slate-200 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">{client.nombre}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            {isEditingPhone ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        className="bg-slate-100 border border-slate-300 rounded px-2 py-1 w-32"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Teléfono"
                                    />
                                    <button onClick={savePhone} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"><Save size={14} /></button>
                                    <button onClick={() => setIsEditingPhone(false)} className="bg-slate-200 text-slate-600 p-1 rounded hover:bg-slate-300"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingPhone(true)}>
                                    <span>{phone || 'Sin teléfono'}</span>
                                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`text-right ${client.deuda_actual > 0 ? 'text-red-600' : (client.deuda_actual < 0 ? 'text-emerald-500' : 'text-slate-400')}`}>
                    <p className="text-xs font-bold uppercase">{client.deuda_actual < 0 ? 'A Favor' : 'Deuda'}</p>
                    <p className="text-3xl font-black">${Math.abs(client.deuda_actual)}</p>

                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                {history.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.monto > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{item.detalle || 'Sin detalle'}</p>
                                {/* Removed date/time display as per instruction */}
                            </div>
                        </div>
                        <span className={`font-bold ${item.monto > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.monto > 0 ? `$${item.monto}` : `- $${Math.abs(item.monto)}`}
                        </span>
                    </div>
                ))}
            </div>

            {/* FLOATING ACTION BUTTON: PAY */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 shadow-up">
                {!showPayInput ? (
                    <button
                        onClick={() => setShowPayInput(true)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <DollarSign size={24} />
                        ENTREGAR DINERO
                    </button>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <p className="text-xs font-bold text-slate-400 uppercase">Monto a Entregar:</p>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="number"
                                className="flex-1 bg-slate-100 p-4 rounded-xl text-3xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                placeholder="$0"
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleManualPayment()}
                            />
                            <button
                                onClick={handleManualPayment}
                                className="bg-emerald-500 text-white px-6 rounded-xl font-bold"
                            >
                                CONFIRMAR
                            </button>
                        </div>
                        <button onClick={() => setShowPayInput(false)} className="w-full text-slate-400 text-xs py-2">Cancelar</button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ClientDetailView;
