import { Order } from '../types';
import { formatUSD, formatSecondary } from './currency';

export function buildWhatsAppMessage(order: Order): string {
  const deliveryNames: Record<string, string> = {
    delivery_express: '🛵 Delivery Express a Domicilio',
    retiro_tienda: '🏪 Retiro en Tienda',
    envio_nacional: '📦 Envío Nacional'
  };

  const paymentNames: Record<string, string> = {
    pago_movil: '📱 Pago Móvil (Bs)',
    zelle: '🇺🇸 Zelle (USD)',
    efectivo_usd: '💵 Efectivo en Dólares ($)',
    binance_usdt: '🪙 Binance Pay (USDT)',
    transferencia: '🏦 Transferencia Bancaria',
    punto_de_venta: '💳 Punto de Venta (Tarjeta)'
  };

  const formattedItems = order.items
    .map(item => {
      const optionText = item.selectedOption ? ` [${item.selectedOption}]` : '';
      const unitSecondary = formatSecondary(
        item.priceUSD,
        order.exchangeRateUsed,
        order.secondaryCurrencySymbol,
        order.secondaryCurrencyCode
      );
      const subSecondary = formatSecondary(
        item.priceUSD * item.quantity,
        order.exchangeRateUsed,
        order.secondaryCurrencySymbol,
        order.secondaryCurrencyCode
      );
      return `• *${item.quantity}x ${item.name}*${optionText}\n  Unit: ${formatUSD(item.priceUSD)} (${unitSecondary}) ➜ *Subtotal: ${formatUSD(item.priceUSD * item.quantity)}* (${subSecondary})`;
    })
    .join('\n\n');

  const totalSecondaryText = formatSecondary(
    order.totalUSD,
    order.exchangeRateUsed,
    order.secondaryCurrencySymbol,
    order.secondaryCurrencyCode
  );

  const lines = [
    `🛍️ *NUEVO PEDIDO DIGITAL 24/7*`,
    `🔖 *Código:* #${order.orderNumber}`,
    `📅 *Fecha:* ${new Date(order.createdAt).toLocaleString('es-VE')}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *DATOS DEL CLIENTE*`,
    `• *Nombre:* ${order.customerName}`,
    `• *Teléfono:* ${order.customerPhone}`,
    `• *Entrega:* ${deliveryNames[order.deliveryMethod] || order.deliveryMethod}`,
    order.customerAddress ? `• *Dirección:* ${order.customerAddress}` : '',
    `• *Método de Pago:* ${paymentNames[order.paymentMethod] || order.paymentMethod}`,
    `• *Tasa Aplicada:* ${order.secondaryCurrencySymbol} ${order.exchangeRateUsed.toFixed(2)} por 1 USD`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📦 *DETALLE DE PRODUCTOS:*`,
    formattedItems,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *RESUMEN DE PAGO BIMONETARIO:*`,
    `💵 *TOTAL USD:* ${formatUSD(order.totalUSD)}`,
    `🇻🇪 *TOTAL ${order.secondaryCurrencyCode}:* ${totalSecondaryText}`,
    order.notes ? `\n📝 *NOTAS ADICIONALES:*\n"${order.notes}"` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ _Pedido generado desde el catálogo online 24/7. Por favor confírmeme disponibilidad y datos de pago._`
  ];

  return lines.filter(Boolean).join('\n');
}

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone || typeof phone !== 'string') return '584140978185';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '584140978185';
  // If Venezuelan domestic format e.g. 04140978185 (11 digits starting with 0)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '58' + cleaned.substring(1);
  } else if (!cleaned.startsWith('58') && (cleaned.startsWith('414') || cleaned.startsWith('424') || cleaned.startsWith('412') || cleaned.startsWith('416') || cleaned.startsWith('426')) && cleaned.length === 10) {
    cleaned = '58' + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppLink(merchantPhone?: string, order?: Order): string {
  const cleanPhone = formatWhatsAppPhone(merchantPhone || '584140978185');
  const message = order ? buildWhatsAppMessage(order) : 'Hola! Quisiera realizar un pedido.';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateCustomerChatLink(customerPhone?: string, orderNumber?: string): string {
  const cleanPhone = formatWhatsAppPhone(customerPhone || '');
  const greeting = `Hola! Te escribimos de la tienda sobre tu pedido #${orderNumber || ''} recibido en nuestro catálogo digital 24/7.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
}
