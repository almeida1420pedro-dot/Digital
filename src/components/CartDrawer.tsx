import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { CartItem, Order, StoreConfig } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';
import { generateWhatsAppLink } from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  config: StoreConfig;
  onSubmitOrder: (orderData: Partial<Order>) => Promise<Order>;
  onOrderSuccess: (order: Order, whatsappUrl: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  config,
  onSubmitOrder,
  onOrderSuccess
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery_express' | 'retiro_tienda' | 'envio_nacional'>('delivery_express');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'zelle' | 'efectivo_usd' | 'binance_usdt' | 'transferencia'>('pago_movil');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const subtotalUSD = items.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalUSD = subtotalUSD;
  const subtotalSecondary = subtotalUSD * config.baseExchangeRate;
  const totalSecondary = totalUSD * config.baseExchangeRate;

  // Robust function to launch WhatsApp across mobile, desktop, and iframe environments
  const triggerWhatsApp = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback to direct location change if popups are completely blocked
        window.location.href = url;
      }
    }
  };

  // 1-Click Direct WhatsApp order from Cart
  const handleDirectWhatsAppClick = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const orderPayload: Partial<Order> = {
      customerName: customerName.trim() || 'Cliente Catálogo Web',
      customerPhone: customerPhone.trim() || 'Contacto por WhatsApp',
      customerAddress: customerAddress.trim() || 'Coordinar entrega por WhatsApp',
      deliveryMethod,
      paymentMethod,
      notes: notes.trim() || 'Pedido directo desde la bolsa de compras',
      items: items.map((it) => ({
        productId: it.product.id,
        name: it.product.name,
        quantity: it.quantity,
        priceUSD: it.product.priceUSD,
        priceSecondary: it.product.priceUSD * config.baseExchangeRate,
        selectedOption: it.selectedOption
      })),
      subtotalUSD,
      subtotalSecondary,
      totalUSD,
      totalSecondary,
      exchangeRateUsed: config.baseExchangeRate,
      secondaryCurrencySymbol: config.secondaryCurrencySymbol,
      secondaryCurrencyCode: config.secondaryCurrencyCode,
      whatsappSent: true
    };

    let targetOrder: Order;
    let whatsappUrl = '';

    try {
      targetOrder = await onSubmitOrder(orderPayload);
    } catch (err) {
      console.warn('Fallback local order generation for WhatsApp:', err);
      targetOrder = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderNumber: `VD-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        customerName: orderPayload.customerName || 'Cliente Catálogo Web',
        customerPhone: orderPayload.customerPhone || 'Contacto por WhatsApp',
        customerAddress: orderPayload.customerAddress || 'Coordinar entrega por WhatsApp',
        deliveryMethod,
        paymentMethod,
        notes: orderPayload.notes || '',
        items: orderPayload.items || [],
        subtotalUSD,
        subtotalSecondary,
        totalUSD,
        totalSecondary,
        exchangeRateUsed: config.baseExchangeRate,
        secondaryCurrencySymbol: config.secondaryCurrencySymbol,
        secondaryCurrencyCode: config.secondaryCurrencyCode,
        status: 'pendiente',
        whatsappSent: true
      };
    }

    whatsappUrl = generateWhatsAppLink(config.whatsappNumber, targetOrder);

    // Open WhatsApp reliably
    triggerWhatsApp(whatsappUrl);

    // Complete order flow
    onClearCart();
    onOrderSuccess(targetOrder, whatsappUrl);
    setStep('cart');
    setIsSubmitting(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre');
      return;
    }
    if (deliveryMethod !== 'retiro_tienda' && !customerAddress.trim()) {
      setErrorMessage('Por favor indica tu dirección de entrega o ciudad');
      return;
    }

    handleDirectWhatsAppClick();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h2 className="text-base font-bold text-stone-900">
              {step === 'cart' ? `Bolsa de Pedido (${items.length})` : 'Datos para Despacho'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar bolsa"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-1" />
              <p className="text-stone-700 font-semibold text-sm">Tu bolsa de pedido está vacía</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explora el catálogo y añade productos para enviar tu orden directa al WhatsApp.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
              >
                Volver al Catálogo
              </button>
            </div>
          ) : step === 'cart' ? (
            /* Step 1: Itemized Cart */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-stone-100">
                {items.map((item) => {
                  const itemSecondaryPrice = formatSecondary(
                    item.product.priceUSD * item.quantity,
                    config.baseExchangeRate,
                    config.secondaryCurrencySymbol,
                    config.secondaryCurrencyCode
                  );
                  return (
                    <div key={item.product.id} className="py-3 flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-lg object-cover bg-stone-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] font-mono text-stone-500 tabular-nums">
                          {formatUSD(item.product.priceUSD)} c/u
                        </div>
                        <div className="text-xs font-mono font-bold text-stone-900 tabular-nums mt-0.5">
                          {formatUSD(item.product.priceUSD * item.quantity)}
                          <span className="text-[10px] text-stone-500 font-normal ml-1">
                            ({itemSecondaryPrice})
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-200 rounded-md bg-stone-50">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-mono text-xs font-semibold text-stone-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Optional Quick Name for WhatsApp greeting */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <label className="block text-[11px] font-semibold text-stone-700">
                  Tu Nombre o Referencia (Opcional):
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Pedro Almeida"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Rate Reminder Banner */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600">
                <div className="flex items-center justify-between font-medium">
                  <span>Tasa del día aplicada:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    1 USD = {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Los precios se convierten automáticamente en vivo para transparencia total.
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Customer Details & Checkout */
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Pedro Almeida"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tu Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: +58 412 1234567"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Modalidad de Entrega
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
                >
                  <option value="delivery_express">🛵 Delivery Express a Domicilio</option>
                  <option value="retiro_tienda">🏪 Retiro Personal en Tienda</option>
                  <option value="envio_nacional">📦 Envío Nacional (MRW / Tealca / Zoom)</option>
                </select>
              </div>

              {deliveryMethod !== 'retiro_tienda' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Dirección de Entrega / Ciudad *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Calle, Edificio/Casa, Punto de referencia y Ciudad..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Preferencia de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
                >
                  <option value="pago_movil">📱 Pago Móvil (Tasa Oficial Bs.)</option>
                  <option value="transferencia">🏦 Transferencia Bancaria Nacional</option>
                  <option value="efectivo_usd">💵 Divisas / Efectivo en Dólares ($)</option>
                  <option value="binance_usdt">🪙 Binance Pay USDT</option>
                  <option value="punto_de_venta">💳 Punto de Venta (Tarjeta Débito/Crédito)</option>
                  <option value="zelle">🇺🇸 Zelle (Dólares USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Llamar al llegar, entregar en portería..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer with Totals and Action */}
        {items.length > 0 && (
          <div className="p-6 border-t border-stone-200 bg-stone-50">
            {/* Totals */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} ítems):</span>
                <span className="font-mono tabular-nums">{formatUSD(subtotalUSD)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-stone-900">Total Bimonetario:</span>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-stone-900 tabular-nums">
                    {formatUSD(totalUSD)}
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatSecondary(totalUSD, config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            {step === 'cart' ? (
              <div className="space-y-2.5">
                {/* PRIMARY 1-CLICK BUTTON: Direct Send to WhatsApp */}
                <button
                  type="button"
                  onClick={handleDirectWhatsAppClick}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Preparando pedido...' : 'Enviar Pedido Directo a WhatsApp'}</span>
                </button>

                {/* Secondary Option: Add more delivery / payment details */}
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Agregar dirección y método de pago (Opcional)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Atención 24/7 directa al WhatsApp oficial de la tienda</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Registrando Pedido...' : 'Confirmar y Enviar a WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="w-full py-2 text-stone-600 hover:text-stone-900 text-xs font-medium text-center"
                >
                  ← Volver a la bolsa de pedido
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
