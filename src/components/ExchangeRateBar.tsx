import React from 'react';
import { StoreConfig } from '../types';

interface ExchangeRateBarProps {
  config: StoreConfig;
}

export const ExchangeRateBar: React.FC<ExchangeRateBarProps> = ({ config }) => {
  return (
    <div
      style={{ backgroundColor: '#17624e', height: '25px' }}
      className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-300 text-xs border-b border-stone-800/80 shadow-2xs py-1 px-3 sm:px-6 flex items-center justify-center"
    >
      <div
        style={{ backgroundColor: '#2c4f4f', color: '#2d201b' }}
        className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-wrap"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-400 uppercase text-[11px] tracking-wider">
          Tasa Oficial BCV:
        </span>
        <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide tabular-nums">
          $1.00 USD = {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)} {config.secondaryCurrencyCode}
        </span>
      </div>
    </div>
  );
};
