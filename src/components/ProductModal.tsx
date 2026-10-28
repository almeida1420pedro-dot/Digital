import React, { useState } from 'react';
import { X, Check, ShoppingBag, MessageCircle, ShieldCheck, Zap, Plus, Minus, CheckCircle } from 'lucide-react';
import { CurrencyDisplayMode, Product, StoreConfig } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';

interface ProductModalProps {
  product: Product | null;
  config: StoreConfig;
  currencyMode: CurrencyDisplayMode;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onDirectWhatsApp: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  config,
  currencyMode,
  onClose,
  onAddToCart,
  onDirectWhatsApp
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const totalUSD = product.priceUSD * quantity;
  const totalSecondary = formatSecondary(
    totalUSD,
    config.baseExchangeRate,
    config.secondaryCurrencySymbol,
    config.secondaryCurrencyCode
  );

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200/90 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-300 ring-1 ring-black/[0.04]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-stone-900/60 sm:bg-stone-100 text-white sm:text-stone-700 hover:bg-stone-900 sm:hover:bg-stone-200 transition-colors shadow-sm"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            
            {/* Image Preview Container */}
            <div className="bg-stone-100 relative aspect-4/3 sm:aspect-auto sm:min-h-[320px] flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-3 left-3 bg-stone-900/95 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
                  {product.badge}
                </div>
              )}
              {product.stock <= 0 ? (
                <div className="absolute top-3 right-3 bg-stone-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Agotado</span>
                </div>
              ) : (
                <div className="absolute top-3 right-3 bg-white/95 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Disponible</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4 sm:p-6 flex flex-col justify-between">
              <div>
                {/* Category & SKU */}
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
                  <span className="font-semibold text-emerald-700 uppercase tracking-wide">
                    {product.category}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-stone-400">SKU: {product.sku}</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight leading-snug">
                  {product.name}
                </h2>

                {/* Bimonetary Price Highlight Box with modern border */}
                <div className="mt-3 p-3 bg-stone-50 border border-stone-200/90 rounded-2xl sm:rounded-3xl shadow-2xs">
                  <div className="text-[11px] text-stone-500 font-medium">Precio Unitario:</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-stone-900">
                      {formatUSD(product.priceUSD)}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                      {formatSecondary(
                        product.priceUSD,
                        config.baseExchangeRate,
                        config.secondaryCurrencySymbol,
                        config.secondaryCurrencyCode
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Tasa BCV: {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Highlights */}
                {product.features && product.features.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Características:
                    </span>
                    <ul className="text-xs text-stone-600 space-y-1 mt-1.5">
                      {product.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quantity Stepper with modern rounded shape */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Cantidad a pedir:</span>
                <div className="flex items-center border border-stone-300 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 sm:px-3 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 font-mono text-xs font-bold text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 sm:px-3 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Mobile/Desktop Action Bar */}
        <div className="p-3.5 sm:p-5 bg-stone-50 border-t border-stone-200/90 shrink-0">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-stone-500 font-medium">Total de este producto:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">
              {formatUSD(totalUSD)} <span className="text-xs text-emerald-700">({totalSecondary})</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className={`py-3 px-3 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs border ${
                added
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Al Carrito</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDirectWhatsApp(product, quantity)}
              className="py-3 px-3 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-xs border border-emerald-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pedir por WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
