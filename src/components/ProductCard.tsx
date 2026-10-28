import React, { useState } from 'react';
import { Plus, Minus, Check, Package, ShoppingCart } from 'lucide-react';
import { CurrencyDisplayMode, Product, StoreConfig } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  config: StoreConfig;
  currencyMode: CurrencyDisplayMode;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  cartQuantity?: number;
  onUpdateCartQuantity?: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  config,
  currencyMode,
  onAddToCart,
  onSelectProduct,
  cartQuantity = 0,
  onUpdateCartQuantity
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const priceUSDText = formatUSD(product.priceUSD);
  const priceSecondaryText = formatSecondary(
    product.priceUSD,
    config.baseExchangeRate,
    config.secondaryCurrencySymbol,
    config.secondaryCurrencyCode
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer flex flex-col bg-white border border-stone-200/90 hover:border-emerald-500/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative select-none ring-1 ring-black/[0.03]"
    >
      {/* Product Image Slot with Compact 4:3 Framing */}
      <div className="relative aspect-[4/3] bg-stone-100/90 overflow-hidden border-b border-stone-100">
        {/* Placeholder / Skeleton Fallback */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-2 bg-stone-100 text-stone-400 transition-opacity ${
            imageLoaded && !imageError ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Package className="w-6 h-6 sm:w-8 sm:h-8 mb-1 stroke-1 text-stone-300" />
          <span className="text-[9px] sm:text-[10px] text-stone-400 font-medium text-center line-clamp-1 px-1">
            {product.name}
          </span>
        </div>

        {!imageError && (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Status / Promotional Badge */}
        {product.badge && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-stone-900/90 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/10 shadow-xs">
            {product.badge}
          </div>
        )}

        {/* In-Cart Quick Indicator */}
        {cartQuantity > 0 && (
          <div className="absolute bottom-1.5 left-1.5 bg-emerald-600/95 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs animate-in zoom-in-95 duration-200">
            <ShoppingCart className="w-2.5 h-2.5" />
            <span>En carrito ({cartQuantity})</span>
          </div>
        )}

        {/* Stock Availability Badge without showing remaining units to public */}
        {product.stock <= 0 ? (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 bg-stone-900/90 text-white backdrop-blur-md px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold border border-white/10 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Agotado</span>
          </div>
        ) : (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Disponible</span>
          </div>
        )}
      </div>

      {/* Product Content Module - Compact Density */}
      <div className="p-2 sm:p-3 flex flex-col flex-1 justify-between gap-1.5 bg-white">
        <div>
          {/* Category Tag */}
          <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-0.5 truncate">
            {product.category}
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[1.8rem] sm:min-h-[2rem]">
            {product.name}
          </h3>

          {/* Short description */}
          <p className="hidden md:block text-[10px] text-stone-500 line-clamp-1 mt-0.5 leading-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Interactive Add to Cart Footer */}
        <div className="pt-1.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
          {/* Bimonetary Price Display */}
          <div className="flex flex-col min-w-0">
            {currencyMode === 'usd' ? (
              <span className="text-xs sm:text-sm md:text-base font-bold text-stone-900 font-mono tabular-nums leading-none">
                {priceUSDText}
              </span>
            ) : currencyMode === 'secondary' ? (
              <span className="text-[11px] sm:text-xs md:text-sm font-bold text-stone-900 font-mono tabular-nums leading-none truncate">
                {priceSecondaryText}
              </span>
            ) : (
              <>
                <span className="text-xs sm:text-sm md:text-base font-bold text-stone-900 font-mono tabular-nums leading-none">
                  {priceUSDText}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/60 px-1 py-0.2 rounded mt-0.5 tabular-nums truncate">
                  {priceSecondaryText}
                </span>
              </>
            )}
          </div>

          {/* Interactive Stepper or Quick Add Button */}
          {cartQuantity > 0 && onUpdateCartQuantity ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-emerald-600 text-white rounded-lg sm:rounded-xl shadow-xs overflow-hidden h-7 sm:h-8 border border-emerald-500"
            >
              <button
                type="button"
                onClick={() => onUpdateCartQuantity(product, cartQuantity - 1)}
                className="px-2 h-full hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center cursor-pointer"
                title="Quitar una unidad"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="px-1.5 font-mono font-bold text-xs tabular-nums text-white min-w-[18px] text-center select-none">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateCartQuantity(product, cartQuantity + 1)}
                className="px-2 h-full hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center cursor-pointer"
                title="Agregar otra unidad"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              aria-label={`Añadir ${product.name} al pedido`}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 shadow-xs border cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-stone-900 hover:bg-emerald-600 text-white border-stone-800 hover:border-emerald-500 shadow-stone-900/10'
              }`}
              title="Añadir al pedido"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Listo</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Añadir</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
