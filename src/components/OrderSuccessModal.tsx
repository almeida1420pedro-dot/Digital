import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, X } from 'lucide-react';
import { Order } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';
import { buildWhatsAppMessage } from '../utils/whatsapp';

interface OrderSuccessModalProps {
  order: Order | null;
  whatsappUrl: string;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  whatsappUrl,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const rawMessage = buildWhatsAppMessage(order);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200/90 relative animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/[0.04]">
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            ¡Pedido Registrado con Éxito!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Código de Pedido: <span className="font-mono font-bold text-stone-900">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Details Summary Box */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-2.5 text-xs shadow-2xs">
          <div className="flex justify-between items-center text-stone-600">
            <span>Cliente:</span>
            <span className="font-semibold text-stone-900">{order.customerName}</span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span>Teléfono / WhatsApp:</span>
            <span className="font-mono font-medium text-stone-900">{order.customerPhone}</span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span>Total a Pagar en USD:</span>
            <span className="font-mono font-bold text-stone-900 tabular-nums">
              {formatUSD(order.totalUSD)}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span>Total en {order.secondaryCurrencyCode}:</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {formatSecondary(order.totalUSD, order.exchangeRateUsed, order.secondaryCurrencySymbol, order.secondaryCurrencyCode)}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-500 text-[11px] pt-1 border-t border-stone-200">
            <span>Tasa de cambio aplicada:</span>
            <span className="font-mono">{order.secondaryCurrencySymbol} {order.exchangeRateUsed.toFixed(2)} / USD</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Abrir y Enviar Mensaje por WhatsApp</span>
          </a>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Mensaje copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar texto formateado del pedido</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-stone-400 text-center mt-4">
          La tienda recibió la notificación push al instante. Te contactaremos enseguida para coordinar el pago y despacho.
        </p>
      </div>
    </div>
  );
};
