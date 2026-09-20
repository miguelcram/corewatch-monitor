import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, ArrowRightLeft } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterStatus === 'ALL') return true;
    return tx.status === filterStatus;
  });

  useEffect(() => {
    //Conexion nativa al endponit SSE de SpringBoot
    const eventSource = new EventSource('http://localhost:8080/api/v1/transactions/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('TRANSACTION_CREATED', (event) => {
      const newTx = JSON.parse(event.data);
      //Insertamos la neuva transacción al inicio de la lista
      setTransactions((prev) => [newTx, ...prev]);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    //Cleanup: cerrar la conexión al desmontar el compenente
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Cabecera y estado de conexión */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider">COREWATCH</h1>
              <p className="text-xs text-slate-400 font-mono">Real-Time Transaction Risk Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-mono text-slate-300">
              {isConnected ? 'STREAM CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </header>

        {/* Tabla de operaciones en tiempo real */}
        <main className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">LIVE FEED DE TRANSACCIONES</h2>

              {/* Botones de filtro rápido */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['ALL', 'APPROVED', 'FLAGGED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded text-[11px] font-mono transition-colors ${
                      filterStatus === status
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Mostrando: {filteredTransactions.length} de {transactions.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">ID Transacción</th>
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Origen → Destino</th>
                  <th className="p-3">Importe</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      Esperando transacciones entrantes vía SSE...
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-slate-800/60 cursor-pointer transition-colors">
                      <td className="p-3 text-slate-400 truncate max-w-[140px]" title={tx.id}>
                        {tx.id}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 flex items-center gap-1.5 text-slate-300">
                        <span>{tx.sourceAccount}</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                        <span>{tx.destinationAccount}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.currency}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          tx.riskScore > 50
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {tx.riskScore}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          tx.status === 'FLAGGED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {tx.status === 'FLAGGED' ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Modal / Panel lateral de detalle */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>Detalle de Transacción</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    selectedTx.riskScore > 50 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    Score: {selectedTx.riskScore}
                  </span>
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1 bg-slate-800 rounded"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <p className="text-slate-500">ID ÚNICO</p>
                  <p className="text-slate-300 break-all">{selectedTx.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">IP DE ORIGEN</p>
                  <p className="text-slate-300">{selectedTx.clientIp || 'Desconocida'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">CUENTA ORIGEN</p>
                  <p className="text-slate-300">{selectedTx.sourceAccount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">CUENTA DESTINO</p>
                  <p className="text-slate-300">{selectedTx.destinationAccount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">IMPORTE</p>
                  <p className="text-slate-200 text-sm font-semibold">
                    {selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedTx.currency}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">MARCA DE TIEMPO (UTC)</p>
                  <p className="text-slate-300">{new Date(selectedTx.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">Diagnóstico del motor:</p>
                <p>
                  {selectedTx.isFraudulent
                    ? 'ALERTA: Transferencia superior al umbral estándar (10.000,00 EUR). Requiere revisión por analista SOC.'
                    : 'CONFIRMADO: Parámetros dentro de los márgenes nominales de operación.'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
