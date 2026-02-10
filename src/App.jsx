import React, { useState, useEffect, useCallback, useRef } from 'react';
import Keypad from './components/Keypad';
import BottomNav from './components/BottomNav';
import ActionPanel from './components/ActionPanel';
import TransactionList from './components/TransactionList';
import DebtModal from './components/DebtModal';
import DebtorsView from './components/DebtorsView';
import ClientDetailView from './components/ClientDetailView';
import HistoryView from './components/HistoryView';
import SalidaModal from './components/SalidaModal';
import { History } from 'lucide-react';
const API_URL = '';

function App() {
  const [view, setView] = useState('POS'); // POS | DEBT | HISTORY
  const [selectedClient, setSelectedClient] = useState(null);

  // --- INPUT STATE (Lifted from Keypad) ---
  const [input, setInput] = useState('');

  // --- DATE LOGIC ---
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [activeDate, setActiveDate] = useState(getLocalDate());

  // --- DATA STATE ---
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ ventas: 0, salidas: 0, fiado_hoy: 0 });

  // --- MODALS STATE ---
  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  // --- INPUT HANDLERS ---
  const handleNumInput = (val) => {
    if (val === 'DEL') {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    if (input.length > 9) return;
    setInput(prev => prev + val);
  };

  // --- ACTION HANDLERS ---
  const handleActionClick = (actionType) => {
    if (!input) return; // No action if empty
    const amount = parseInt(input);

    if (actionType === 'FIADO') {
      setPendingAmount(amount);
      setIsFiadoModalOpen(true);
      return;
    }
    if (actionType === 'SALIDA') {
      setPendingAmount(amount);
      setIsSalidaModalOpen(true);
      return;
    }
    if (actionType === 'VENTA') {
      processTransaction('VENTA', amount);
      setInput(''); // Clear after sale
    }
  };

  const processTransaction = async (tipo, monto, detalle = '') => {
    try {
      await fetch(`${API_URL}/api/movimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, monto, detalle, fecha: activeDate })
      });
      // fetchData triggered by SSE or manual call below
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    try {
      const resResumen = await fetch(`${API_URL}/api/resumen-dia?fecha=${activeDate}`);
      const dataResumen = await resResumen.json();
      setSummary(dataResumen);

      const resMovs = await fetch(`${API_URL}/api/movimientos-dia?fecha=${activeDate}`);
      const dataMovs = await resMovs.json();
      setTransactions(dataMovs.map(m => ({
        ...m,
        timestamp: m.timestamp || new Date().toISOString()
      })));
    } catch (err) {
      console.error("Error", err);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, view]);

  // --- SSE REAL-TIME ---
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    isModalOpenRef.current = isFiadoModalOpen || isSalidaModalOpen;
  }, [isFiadoModalOpen, isSalidaModalOpen]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/api/events`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE' && !isModalOpenRef.current) {
          fetchData();
        }
      } catch (e) {
        console.error("Error SSE", e);
      }
    };
    return () => eventSource.close();
  }, [fetchData]);

  // --- MODAL SUBMITS ---
  const handleFiadoSubmit = async (payload) => {
    try {
      await fetch(`${API_URL}/api/fiado/nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, fecha: activeDate })
      });
      setIsFiadoModalOpen(false);
      setInput('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSalidaSubmit = async (detalle) => {
    await processTransaction('SALIDA', pendingAmount, detalle);
    setIsSalidaModalOpen(false);
    setInput('');
  };

  // --- DELETE TRANSACTION ---
  const handleDeleteTransaction = async (id, tipo) => {
    if (!window.confirm("¿Borrar este movimiento?")) return;
    try {
      await fetch(`${API_URL}/api/transaccion`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo })
      });
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // --- FORMATTING ---
  const displayValue = input ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(input) : '$0';

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col pb-24 md:pb-0">

      {/* 1. HEADER (Compact) */}
      <div className="bg-slate-900 p-3 flex justify-between items-center shadow-md border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ventas de Hoy</p>
            <p className="text-2xl font-black text-emerald-400 leading-none">${summary.ventas}</p>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex gap-2 ml-8">
            <button
              onClick={() => setView('POS')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'POS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              CAJA
            </button>
            <button
              onClick={() => setView('DEBT')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'DEBT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              DEUDAS
            </button>
            <button
              onClick={() => setView('HISTORY')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'HISTORY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              HISTORIAL
            </button>
          </div>
        </div>

        <div>
          <input
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="bg-slate-800 text-white font-bold rounded-lg px-2 py-1 text-xs border border-slate-700 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* VIEW RENDERER */}
      {/* VIEW RENDERER */}
      <div className="flex-1 w-full max-w-7xl mx-auto md:p-6">

        {view === 'POS' && (
          <>
            <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
              {/* LEFT COLUMN (Mobile: Top) */}
              <div className="flex flex-col gap-2">

                {/* DISPLAY */}
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0">Monto Actual</p>
                  <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-xl">
                    {displayValue}
                  </div>
                </div>

                {/* KEYPAD */}
                <Keypad onInput={handleNumInput} />

                {/* ACTION PANEL */}
                <ActionPanel onAction={handleActionClick} disabled={!input} />
              </div>

              {/* RIGHT COLUMN (Mobile: Bottom Scroll) */}
              <div className="p-4 md:h-[600px] md:overflow-y-auto custom-scrollbar md:bg-slate-900 md:rounded-3xl md:border md:border-slate-800">
                <div className="flex items-center gap-2 mb-4 opacity-50">
                  <History size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Últimos Movimientos</span>
                </div>
                <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />

                {/* Spacer for bottom nav on mobile */}
                <div className="h-20 md:hidden"></div>
              </div>
            </div>
          </>
        )}

        {view === 'DEBT' && (
          <div className="p-4 h-full">
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

        {view === 'HISTORY' && (
          <div className="p-4 h-full">
            <HistoryView />
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      {!selectedClient && (
        <BottomNav activeView={view} onViewChange={(v) => { setView(v); setSelectedClient(null); }} />
      )}

      {/* MODALS */}
      <DebtModal
        isOpen={isFiadoModalOpen}
        onClose={() => setIsFiadoModalOpen(false)}
        amount={pendingAmount}
        onSubmit={handleFiadoSubmit}
      />
      <SalidaModal
        isOpen={isSalidaModalOpen}
        onClose={() => setIsSalidaModalOpen(false)}
        amount={pendingAmount}
        onSubmit={handleSalidaSubmit}
      />

    </div>
  );
}

export default App;

