import { ArrowUpRight, ArrowDownLeft, User, Trash2 } from 'lucide-react';

const TransactionList = ({ transactions, onDelete }) => {
    return (
        <div className="flex flex-col h-full bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Últimos Movimientos</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {transactions.length === 0 && (
                    <div className="text-center text-slate-400 py-10 text-sm">No hay movimientos hoy</div>
                )}

                {transactions.map((t) => (
                    <div key={`${t.id}-${t.tipo}`} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${t.tipo === 'VENTA' ? 'bg-emerald-100 text-emerald-600' :
                                t.tipo === 'SALIDA' ? 'bg-orange-100 text-orange-600' :
                                    'bg-red-100 text-red-600'
                                }`}>
                                {t.tipo === 'VENTA' && <ArrowDownLeft size={18} />}
                                {t.tipo === 'SALIDA' && <ArrowUpRight size={18} />}
                                {t.tipo === 'PAGO_FIADO' && <User size={18} />}
                                {t.tipo === 'NUEVO_FIADO' && <User size={18} />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 text-sm">
                                    {t.tipo === 'PAGO_FIADO' ? `Fiado: ${t.cliente?.nombre || 'Vecino'}` :
                                        t.tipo === 'NUEVO_FIADO' ? `Fiado a: ${t.cliente_nombre}` : t.tipo}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`font-bold ${t.tipo === 'SALIDA' ? 'text-orange-600' : 'text-emerald-600'
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
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
