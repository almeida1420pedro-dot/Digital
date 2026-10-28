import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { StoreConfig } from '../types';

interface CompactInstallCardProps {
  config: StoreConfig;
  onOpenInstructions: () => void;
}

export const CompactInstallCard: React.FC<CompactInstallCardProps> = ({
  config,
  onOpenInstructions
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        const success = await install();
        if (!success) {
          onOpenInstructions();
        }
      } catch {
        onOpenInstructions();
      } finally {
        setInstalling(false);
      }
    } else {
      onOpenInstructions();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-stone-900/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-white border border-stone-800 shadow-xl relative overflow-hidden transition-all hover:border-emerald-600/40">
        {/* Subtle ambient lighting accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* App Icon and Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md border border-stone-700">
              <img
                src={config.logoUrl || '/icon.svg'}
                alt={config.storeName || 'App'}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {config.storeName || 'PETTER HOUSE'}
                </h4>
                <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 uppercase">
                  App
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-stone-400 truncate mt-0.5">
                Instalar en pantalla de inicio · Pedidos 24/7
              </p>

              <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-500 font-medium">
                <span className="text-amber-400">★ 5.0</span>
                <span>•</span>
                <span>Gratis</span>
                <span>•</span>
                <span>0 MB de espacio</span>
              </div>
            </div>
          </div>

          {/* Action Button - High tap target & easy to use */}
          <div className="shrink-0">
            {isInstalled ? (
              <button
                type="button"
                onClick={onOpenInstructions}
                className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden xs:inline">Instalada</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="px-4 py-2.5 sm:px-5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-950 text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span>{installing ? 'Instalando...' : 'Instalar'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
