import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, X, ArrowUpRight, ArrowDownLeft, User } from 'lucide-react';

const HistoryView = () => {
    const [historyDays, setHistoryDays] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drilldown State
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateMovements, setDateMovements] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        // Fetch last 30 days summary
        const API_URL = `http://${window.location.hostname}:3001`;
        fetch(`${API_URL}/api/historial-dias`)
            .then(res => res.json())
            .then(data => {
                setHistoryDays(data);
                setLoading(false);
            });
    }, []);

    const handleDateClick = async (day) => {
        setSelectedDate(day);
        setLoadingDetails(true);
        try {
            const API_URL = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${API_URL}/api/movimientos-dia?fecha=${day.fecha}`);
            const data = await res.json();
            setDateMovements(data);
        } catch (err) {
            console.error(err);
        }
        setLoadingDetails(false);
    };

    const formatDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-');
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando historial...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-900 relative">
            {/* HEADER */}
            <div className="bg-slate-800 p-4 m-4 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3">
                <div className="bg-blue-900/30 p-3 rounded-full text-blue-400">
                    <Calendar size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-200 text-lg">Historial de Cierres</h2>
                    <p className="text-xs text-slate-500">Toca un día para ver el detalle completo</p>
                </div>
            </div>

            {/* ERROR / EMPTY STATE */}
            {historyDays.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>No hay cierres registrados aún.</p>
                </div>
            )}

            {/* LIST */}
            <div className="flex-1 px-4 pb-4 space-y-3">
                {historyDays.map(day => (
                    <button
                        key={day.fecha}
                        onClick={() => handleDateClick(day)}
                        className="w-full bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 hover:bg-slate-700 hover:shadow-lg transition-all group text-left"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-200 capitalize text-lg">{formatDate(day.fecha)}</h3>
                            <ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Ventas</p>
                                    <p className="font-bold text-emerald-400">${day.ventas}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Fiado</p>
                                    <p className="font-bold text-red-400">${day.fiado}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Salidas</p>
                                    <p className="font-bold text-orange-400">${day.salidas}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-bold uppercase">Balance</p>
                                <p className="font-black text-slate-200 text-lg">${day.ventas - day.salidas}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* DETAIL MODAL OVERLAY */}
            {selectedDate && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-20 flex flex-col animation-fade-in p-4 overflow-hidden">
                    <div className="bg-slate-900 flex-1 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">

                        {/* MODAL HEADER WITH ACCOUNTING */}
                        <div className="bg-slate-950 text-white p-6 shrink-0 border-b border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase">Detalle del Día</p>
                                    <h2 className="text-2xl font-bold capitalize">{formatDate(selectedDate.fecha)}</h2>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* ACCOUNTING CARDS */}
                            {!loadingDetails && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">CAJA FINAL</p>
                                        <p className="text-2xl font-black text-emerald-400">
                                            ${dateMovements.reduce((acc, m) => {
                                                if (m.tipo === 'VENTA' || m.tipo === 'INGRESO_DEUDA') return acc + m.monto;
                                                if (m.tipo === 'SALIDA') return acc - m.monto;
                                                return acc;
                                            }, 0)}
                                        </p>
                                        <p className="text-[10px] text-slate-600 mt-1">Efectivo en mano</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">FIADO</p>
                                        <p className="text-2xl font-black text-red-400">
                                            ${dateMovements.filter(m => m.tipo === 'NUEVO_FIADO').reduce((acc, m) => acc + m.monto, 0)}
                                        </p>
                                        <p className="text-[10px] text-slate-600 mt-1">Total fiado hoy</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">MOV. TOTALES</p>
                                        <p className="text-xl font-bold text-white">
                                            {dateMovements.length}
                                        </p>
                                        <p className="text-[10px] text-slate-600 mt-1">Transacciones</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900">
                            {loadingDetails ? (
                                <p className="text-center text-slate-500 mt-10">Cargando movimientos...</p>
                            ) : (
                                <>
                                    {dateMovements.length === 0 && <p className="text-center text-slate-500 mt-10">Sin movimientos registrados este día.</p>}
                                    {dateMovements.map(t => (
                                        <div key={t.id + t.tipo} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${t.tipo === 'VENTA' ? 'bg-emerald-900/50 text-emerald-400' :
                                                    t.tipo === 'SALIDA' ? 'bg-orange-900/50 text-orange-400' :
                                                        t.tipo === 'PAGO_FIADO' || t.tipo === 'INGRESO_DEUDA' ? 'bg-blue-900/50 text-blue-400' :
                                                            t.tipo === 'NUEVO_FIADO' ? 'bg-purple-900/50 text-purple-400' :
                                                                'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {t.tipo === 'VENTA' && <ArrowDownLeft size={16} />}
                                                    {t.tipo === 'SALIDA' && <ArrowUpRight size={16} />}
                                                    {(t.tipo === 'PAGO_FIADO' || t.tipo === 'INGRESO_DEUDA') && <DollarSign size={16} />}
                                                    {t.tipo === 'NUEVO_FIADO' && <User size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm">
                                                        {t.tipo === 'NUEVO_FIADO' ? `Fiado a: ${t.cliente_nombre}` :
                                                            t.tipo === 'INGRESO_DEUDA' ? 'Pago de Deuda' :
                                                                (t.detalle || t.tipo)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        {t.tipo === 'NUEVO_FIADO' && <span className="text-purple-400 font-bold">{t.detalle}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`font-bold ${t.tipo === 'SALIDA' ? 'text-orange-400' :
                                                t.tipo === 'NUEVO_FIADO' ? 'text-purple-400' :
                                                    'text-emerald-400'
                                                }`}>
                                                {t.tipo === 'SALIDA' ? '-' :
                                                    t.tipo === 'NUEVO_FIADO' ? '(Fiado)' : '+'}
                                                ${t.monto}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default HistoryView;
