import React, { useState, useEffect } from 'react';
import Keypad from './components/Keypad';
import TransactionList from './components/TransactionList';
import DebtModal from './components/DebtModal';
import DebtorsView from './components/DebtorsView';
import ClientDetailView from './components/ClientDetailView';
import HistoryView from './components/HistoryView';
import { RefreshCw, LayoutGrid, Users, History, Calculator } from 'lucide-react';

const API_URL = `http://${window.location.hostname}:3001`;

function App() {
  const [view, setView] = useState('POS'); // POS | DEBT | HISTORY
  const [selectedClient, setSelectedClient] = useState(null); // For Client Detail

  // DATE LOGIC (MANUAL DATE SELECTION)
  // FIX: Usar hora local para iniciar, no UTC.
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [activeDate, setActiveDate] = useState(getLocalDate());

  const changeDate = (days) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + days); // Sumar/restar dias sobre la fecha activa (sin offset extra)
    // Ajustar otra vez por si JS hace cosas raras con timezones al reconvertir string
    // Mejor truco: trabajar con strings YYYY-MM-DD
    const newDate = new Date(d.valueOf() + d.getTimezoneOffset() * 60000); // Fix utc conversion
    setActiveDate(d.toISOString().split('T')[0]);
  };

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ ventas: 0, salidas: 0, fiado_hoy: 0 });

  // State for Fiado Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si hay modal abierto o inputs focus
      if (isModalOpen || e.target.tagName === 'INPUT') return;

      // Shortcuts
      // F1 -> POS, F2 -> Deudas, F3 -> Historial
      if (e.key === 'F1') { e.preventDefault(); setView('POS'); }
      if (e.key === 'F2') { e.preventDefault(); setView('DEBT'); }
      if (e.key === 'F3') { e.preventDefault(); setView('HISTORY'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const fetchData = async () => {
    try {
      // 1. Resumen
      const resResumen = await fetch(`${API_URL}/api/resumen-dia?fecha=${activeDate}`);
      const dataResumen = await resResumen.json();
      setSummary(dataResumen);

      // 2. Lista de Movimientos (Ticket Persistente)
      const resMovs = await fetch(`${API_URL}/api/movimientos-dia?fecha=${activeDate}`);
      const dataMovs = await resMovs.json();
      setTransactions(dataMovs.map(m => ({
        ...m,
        timestamp: m.timestamp || new Date().toISOString() // Fallback if needed
      })));

    } catch (err) {
      console.error("Error", err);
    }
  };

  useEffect(() => {
    // When date changes, refresh data. UseEffect already handles cleanup.
    // 'setTransactions([])' is optional visually but good for UX so it doesn't show old data while loading
    setTransactions([]);
    fetchData();
  }, [activeDate, view]); // Refetch when changing views

  const handleKeypadAction = async (tipo, monto) => {
    if (tipo === 'FIADO') {
      setPendingAmount(monto);
      setIsModalOpen(true);
      return;
    }

    try {
      await fetch(`${API_URL}/api/movimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, monto, fecha: activeDate })
      });

      // Optimistic update IS NOT NEEDED if we just fetch, but fetching is slower.
      // Let's optimistic update but adhering to the DB struct format if possible, 
      // OR just simple refetch. Refetch is safer for persistence consistency.
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFiadoSubmit = async (payload) => {
    try {
      await fetch(`${API_URL}/api/fiado/nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, fecha: activeDate })
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleDeleteTransaction = async (id, tipo) => {
    try {
      const res = await fetch(`${API_URL}/api/transaccion`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo })
      });
      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
      } else {
        fetchData(); // Recargar lista
      }
    } catch (err) {
      alert("Error al conectar: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col h-screen overflow-hidden">
      {/* NAVBAR */}
      <nav className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-md z-50 shrink-0 px-4">

        {/* LEFT: DATE SELECTOR IMPROVED */}
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
          <input
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="bg-transparent text-white font-bold border-none focus:ring-0 text-sm cursor-pointer outline-none w-32"
          />
        </div>

        {/* CENTER: TABS */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('POS')}
            className={`p-2 md:px-6 md:py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${view === 'POS' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Calculator size={18} /> <span className="hidden md:inline">CAJA (F1)</span>
          </button>
          <button
            onClick={() => { setView('DEBT'); setSelectedClient(null); }}
            className={`p-2 md:px-6 md:py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${view === 'DEBT' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={18} /> <span className="hidden md:inline">DEUDAS (F2)</span>
          </button>
          <button
            onClick={() => setView('HISTORY')}
            className={`p-2 md:px-6 md:py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${view === 'HISTORY' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <History size={18} /> <span className="hidden md:inline">HIST (F3)</span>
          </button>
        </div>

        <div className="w-20 hidden md:block"></div> {/* Spacer for balance */}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="max-w-6xl mx-auto h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

          {/* VIEW: POS */}
          {view === 'POS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* LEFT: CALC */}
              <div className="p-6 bg-slate-100 flex flex-col gap-4 border-r border-slate-200">
                {/* HEADERS */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Ventas {activeDate === new Date().toISOString().split('T')[0] ? 'Hoy' : activeDate}</p>
                    <h1 className="text-4xl font-black text-emerald-500 tracking-tight">${summary.ventas}</h1>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">En Caja (Est.)</p>
                    <p className="text-lg font-bold text-slate-700">${(summary.ventas) - summary.salidas}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <Keypad onAction={handleKeypadAction} />
                </div>
              </div>
              {/* RIGHT: LIST */}
              <div className="p-4 bg-slate-50 flex flex-col gap-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Salidas</p>
                    <p className="text-xl font-bold text-orange-600">${summary.salidas}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Fiado</p>
                    <p className="text-xl font-bold text-red-600">${summary.fiado_hoy}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
                  <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DEBT */}
          {view === 'DEBT' && (
            <div className="h-full">
              {selectedClient ? (
                <ClientDetailView
                  client={selectedClient}
                  onBack={() => { setSelectedClient(null); fetchData(); }}
                  activeDate={activeDate}
                />
              ) : (
                <DebtorsView onSelectClient={setSelectedClient} />
              )}
            </div>
          )}

          {/* VIEW: HISTORY */}
          {view === 'HISTORY' && (
            <HistoryView />
          )}

        </div>
      </main>

      <DebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={pendingAmount}
        onSubmit={handleFiadoSubmit}
      />
    </div>
  );
}

export default App;
