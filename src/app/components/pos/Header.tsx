import { useState, useEffect } from 'react';
import { Store, Clock, User, Menu } from 'lucide-react';

interface HeaderProps {
  userName: string;
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  shiftNumber?: string;
  shiftSales?: number;
}

export function Header({ userName, title, subtitle, onMenuClick, shiftNumber, shiftSales }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#EC0000] to-[#D50000] text-white shadow-xl">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo y Título de la vista */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-md">
              <Store className="w-6 h-6 text-[#EC0000]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl leading-tight tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-red-50 font-medium">{subtitle}</p>}
            </div>
          </div>

          {/* Reloj en tiempo real */}
          <div className="flex-1 text-center hidden md:block">
            <div className="inline-flex items-center gap-3 bg-white/15 px-5 py-2.5 rounded-xl backdrop-blur-sm border border-white/20">
              <Clock className="w-5 h-5" />
              <div>
                <div className="font-bold text-xl tabular-nums tracking-wide">{formatTime(currentTime)}</div>
                <div className="text-xs text-red-50 capitalize font-medium">{formatDate(currentTime)}</div>
              </div>
            </div>
          </div>

          {/* Turno activo (si existe) */}
          {shiftNumber && (
            <div className="hidden lg:flex items-center gap-2 bg-yellow-500/20 px-4 py-2.5 rounded-xl backdrop-blur-sm border-2 border-yellow-400/50">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-yellow-100">Turno: {shiftNumber}</span>
                <span className="text-sm font-bold text-white">${(shiftSales || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Usuario y Menú */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white/15 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20">
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">{userName}</span>
            </div>
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2.5 hover:bg-white/15 rounded-xl transition-colors border border-transparent hover:border-white/20 active:scale-95"
              aria-label="Menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Reloj móvil */}
        <div className="md:hidden mt-2 text-center">
          <div className="inline-flex items-center gap-2 text-sm bg-white/15 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-semibold tabular-nums">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
