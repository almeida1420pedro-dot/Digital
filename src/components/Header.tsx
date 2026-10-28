import React from 'react';
import { ShoppingBag, DollarSign, Store } from 'lucide-react';
import { CurrencyDisplayMode, StoreConfig, OwnerSession } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  activeView: 'catalog' | 'seller_dashboard';
  setActiveView: (view: 'catalog' | 'seller_dashboard') => void;
  currencyMode: CurrencyDisplayMode;
  setCurrencyMode: (mode: CurrencyDisplayMode) => void;
  config: StoreConfig;
  connected: boolean;
  onOpenCalculator: () => void;
  ownerSession: OwnerSession;
  onOpenAuthModal: () => void;
  onLogoutOwner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  activeView,
  setActiveView,
  currencyMode,
  setCurrencyMode,
  config,
  onOpenCalculator
}) => {
  const [logoFailed, setLogoFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [config.logoUrl]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[52px] sm:min-h-[56px] py-1.5 flex items-center justify-between gap-3 sm:gap-8">
        
        {/* Zone 1: Brand Wordmark & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setActiveView('catalog')}
            className="text-left group flex items-center gap-2 sm:gap-2.5 focus:outline-none"
          >
            {config.logoUrl && !logoFailed ? (
              <div className="relative">
                <img
                  src={config.logoUrl}
                  alt={config.storeName}
                  onError={() => setLogoFailed(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl bg-stone-50 border border-stone-200 shadow-xs shrink-0 p-0.5 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 text-white flex items-center justify-center font-bold text-sm sm:text-base tracking-tighter shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                <span
                  style={{
                    color: '#0d4813',
                    textAlign: 'center',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'normal',
                    textDecorationLine: 'none',
                    fontWeight: 'bold',
                    fontSize: '19px',
                    lineHeight: '28px'
                  }}
                  className="truncate max-w-[180px] sm:max-w-none"
                >
                  {config.storeName}
                </span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Catálogo Digital 24/7
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveView('catalog')}
            className={`whitespace-nowrap transition-colors hover:text-stone-900 flex items-center gap-1.5 ${
              activeView === 'catalog' ? 'text-stone-900 font-semibold' : ''
            }`}
          >
            <span>Catálogo Público</span>
            {activeView === 'catalog' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </button>

          <button
            onClick={onOpenCalculator}
            className="whitespace-nowrap transition-colors hover:text-stone-900 flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Calculadora BCV</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Currency Display Selector (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center p-0.5 bg-stone-100 border border-stone-200/60 rounded-xl text-xs font-medium text-stone-600">
            <button
              onClick={() => setCurrencyMode('dual')}
              title="Mostrar precios en USD y Bolívares"
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === 'dual'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'hover:text-stone-900'
              }`}
            >
              Dual ($ / {config.secondaryCurrencySymbol})
            </button>
            <button
              onClick={() => setCurrencyMode('usd')}
              title="Solo precios en Dólares"
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === 'usd'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'hover:text-stone-900'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrencyMode('secondary')}
              title={`Solo precios en ${config.secondaryCurrencyName}`}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === 'secondary'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'hover:text-stone-900'
              }`}
            >
              {config.secondaryCurrencyCode}
            </button>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            aria-label="Abrir carrito de compras"
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-semibold">Mi Pedido</span>
            {cartCount > 0 ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-bold text-[11px] flex items-center justify-center font-mono animate-in zoom-in-50">
                {cartCount}
              </span>
            ) : (
              <span className="hidden sm:inline text-[11px] text-stone-400 font-mono">0</span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
