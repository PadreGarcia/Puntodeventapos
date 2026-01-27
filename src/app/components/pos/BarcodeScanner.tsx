import { useState } from 'react';
import { Scan, X, Barcode } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-full font-bold shadow-2xl hover:shadow-red-500/50 transition-all active:scale-95 border-2 border-white"
        title="Buscar por código de barras"
      >
        <Scan className="w-6 h-6" />
        <span className="hidden sm:inline">Escanear</span>
      </button>

      {/* Modal del escáner */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Barcode className="w-7 h-7" />
                Buscar Producto
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setManualCode('');
                }}
                className="p-2 hover:bg-white/15 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900 font-medium">
                  💡 <strong>Tip:</strong> Ingresa el código de barras del producto para agregarlo al carrito automáticamente.
                </p>
              </div>

              {/* Entrada manual */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">Código de Barras:</p>
                <form onSubmit={handleManualEntry} className="space-y-4">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej: 7501055300006"
                    autoFocus
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EC0000] focus:border-[#EC0000] outline-none transition-all font-mono text-lg text-center"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Scan className="w-5 h-5" />
                    Buscar y Agregar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
