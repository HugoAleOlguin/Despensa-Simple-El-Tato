import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';

const ClientDetailView = ({ client, onBack, activeDate }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handlePayItem = async (item) => {
        if (!window.confirm(`¿Marcar como pagado: "${item.detalle}" ($${item.monto})?`)) return;

        try {
            const API_URL = `http://${window.location.hostname}:3001`;
            await fetch(`${API_URL}/api/fiado/pagar-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: item.id, fecha_pago: activeDate })
            });

            // Optimistic update or refresh
            fetchHistory();
            // Optional: Update parent client prop if possible, or just let user go back
            client.deuda_actual -= item.monto;
        } catch (err) {
            alert("Error al pagar item");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 relative">

            {/* HEADER */}
            <div className="bg-slate-800 p-4 flex items-center justify-between shadow-lg z-10 border-b border-slate-700 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-400 hover:text-white" />
                    </button>
                    <div>
                        <h2 className="font-bold text-xl text-slate-200">{client.nombre}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            {isEditingPhone ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 w-32 text-white placeholder-slate-500"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Teléfono"
                                    />
                                    <button onClick={savePhone} className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-500"><Save size={14} /></button>
                                    <button onClick={() => setIsEditingPhone(false)} className="bg-slate-700 text-slate-400 p-1 rounded hover:bg-slate-600"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setIsEditingPhone(true)}>
                                    <span>{phone || 'Sin teléfono'}</span>
                                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`text-right ${client.deuda_actual > 0 ? 'text-red-400' : (client.deuda_actual < 0 ? 'text-emerald-400' : 'text-slate-500')}`}>
                    <p className="text-xs font-bold uppercase">{client.deuda_actual < 0 ? 'A Favor' : 'Deuda'}</p>
                    <p className="text-3xl font-black">${Math.abs(client.deuda_actual)}</p>

                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 px-4 py-4 space-y-2 pb-6 overflow-y-auto custom-scrollbar">
                {history.map(item => {
                    const isDebt = item.monto > 0;
                    const isPaid = item.estado === 'PAGADO';

                    return (
                        <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center ${isPaid ? 'bg-slate-800/50 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 shadow-sm'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isDebt ? (isPaid ? 'bg-slate-500' : 'bg-red-500') : 'bg-emerald-500'}`}></div>
                                <div>
                                    <p className={`font-bold text-sm ${isPaid ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.detalle || 'Sin detalle'}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()} - {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`font-bold ${isDebt ? (isPaid ? 'text-slate-500' : 'text-red-400') : 'text-emerald-400'}`}>
                                    {isDebt ? `$${item.monto}` : `- $${Math.abs(item.monto)}`}
                                </span>

                                {isDebt && !isPaid && (
                                    <button
                                        onClick={() => handlePayItem(item)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
                                    >
                                        PAGAR
                                    </button>
                                )}
                                {isPaid && <span className="text-[10px] font-bold text-emerald-500 border border-emerald-900/30 px-2 py-0.5 rounded bg-emerald-900/10">PAGADO</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClientDetailView;
