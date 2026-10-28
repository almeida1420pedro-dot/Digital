import React, { useState } from 'react';
import { X, ArrowRightLeft, DollarSign, RefreshCw } from 'lucide-react';
import { StoreConfig } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';

interface CurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
}

export const CurrencyCalculatorModal: React.FC<CurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const [usdInput, setUsdInput] = useState('50.00');
  const [secondaryInput, setSecondaryInput] = useState(
    (50.0 * config.baseExchangeRate).toFixed(2)
  );
  const [direction, setDirection] = useState<'usdToSec' | 'secToUsd'>('usdToSec');

  if (!isOpen) return null;

  const handleUsdChange = (val: string) => {
    setUsdInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setSecondaryInput((num * config.baseExchangeRate).toFixed(2));
    } else {
      setSecondaryInput('');
    }
  };

  const handleSecondaryChange = (val: string) => {
    setSecondaryInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && config.baseExchangeRate > 0) {
      setUsdInput((num / config.baseExchangeRate).toFixed(2));
    } else {
      setUsdInput('');
    }
  };

  const benchmarks = [10, 20, 50, 100, 200];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 relative animate-in fade-in duration-200 ring-1 ring-black/[0.04]">
        <button
          onClick={onClose}
          aria-label="Cerrar calculadora"
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Calculadora Bimonetaria en Vivo
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              1 USD = {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)} {config.secondaryCurrencyCode}
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-500 mt-2 mb-4">
          Convierte al instante cualquier monto según la tasa activa de la tienda 24/7.
        </p>

        {/* Inputs */}
        <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Monto en Dólares ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-stone-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={usdInput}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold text-stone-900 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <span className="text-stone-400 text-xs font-mono">↕ Conversión Automática ↕</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Equivalente en {config.secondaryCurrencyName} ({config.secondaryCurrencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-stone-500">
                {config.secondaryCurrencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                value={secondaryInput}
                onChange={(e) => handleSecondaryChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-3 py-2 text-base font-mono font-bold text-emerald-800 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Quick Benchmarks */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block mb-2">
            Equivalencias Rápidas:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {benchmarks.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleUsdChange(val.toString())}
                className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-center text-xs font-mono font-medium transition-colors"
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
