import { ArrowUpRight, ArrowDownLeft, User, Trash2 } from 'lucide-react';

const TransactionList = ({ transactions, onDelete }) => {
    return (
        <div className="flex flex-col h-full bg-slate-900 border-none">
            <div className="bg-slate-950 p-4 border-b border-slate-800 rounded-t-xl">
                <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Últimos Movimientos</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-900 border border-slate-800 rounded-b-xl">
                {transactions.length === 0 && (
                    <div className="text-center text-slate-500 py-10 text-sm">No hay movimientos hoy</div>
                )}

                {transactions.map((t) => (
                    <div key={`${t.id}-${t.tipo}`} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-md hover:bg-slate-700/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${t.tipo === 'VENTA' || t.tipo === 'PAGO_FIADO' ? 'bg-emerald-900/50 text-emerald-400' :
                                t.tipo === 'SALIDA' ? 'bg-orange-900/50 text-orange-400' :
                                    'bg-red-900/50 text-red-400'
                                }`}>
                                {t.tipo === 'VENTA' && <ArrowDownLeft size={18} />}
                                {t.tipo === 'SALIDA' && <ArrowUpRight size={18} />}
                                {t.tipo === 'PAGO_FIADO' && <User size={18} />}
                                {t.tipo === 'NUEVO_FIADO' && <User size={18} />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 text-sm">
                                    {t.tipo === 'PAGO_FIADO' ? `${t.cliente_nombre || 'Vecino'} - ${t.detalle}` :
                                        t.tipo === 'NUEVO_FIADO' ? `Fiado a: ${t.cliente_nombre}` :
                                            t.tipo === 'VENTA' ? 'Venta' :
                                                t.tipo === 'SALIDA' ? `Salida: ${t.detalle}` : t.tipo}
                                </p>
                                <p className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`font-bold ${t.tipo === 'SALIDA' ? 'text-orange-400' : 'text-emerald-400'
                                }`}>
                                {t.tipo === 'SALIDA' ? '-' : '+'}${t.monto}
                            </span>

                            {/* BOTON BORRAR (Solo para tipos soportados) */}
                            {['VENTA', 'SALIDA', 'NUEVO_FIADO'].includes(t.tipo) && onDelete && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`¿Borrar este movimiento de $${t.monto}?`)) {
                                            onDelete(t.id, t.tipo);
                                        }
                                    }}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors"
                                    title="Borrar movimiento"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionList;
