export type CurrencyCode = 'USD' | 'VES' | 'EUR' | 'COP';

export type CurrencyDisplayMode = 'dual' | 'usd' | 'secondary';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceUSD: number;
  stock: number;
  image: string;
  description: string;
  features: string[];
  badge?: string;
  sku: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
}

export type OrderStatus = 'pendiente' | 'preparando' | 'en_camino' | 'completado' | 'cancelado';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceUSD: number;
  priceSecondary: number;
  selectedOption?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: 'delivery_express' | 'retiro_tienda' | 'envio_nacional';
  paymentMethod: 'pago_movil' | 'zelle' | 'efectivo_usd' | 'binance_usdt' | 'transferencia' | 'punto_de_venta';
  notes?: string;
  items: OrderItem[];
  subtotalUSD: number;
  subtotalSecondary: number;
  totalUSD: number;
  totalSecondary: number;
  exchangeRateUsed: number;
  secondaryCurrencySymbol: string;
  secondaryCurrencyCode: CurrencyCode;
  status: OrderStatus;
  whatsappSent?: boolean;
}

export interface CategoryConfig {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  badgeText?: string;
  color?: string;
}

export interface StoreConfig {
  storeName: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  whatsappNumber: string;
  isOpen247: boolean;
  announcement: string;
  baseExchangeRate: number; // e.g. 876.80 Bs per USD
  autoSyncBCV?: boolean;
  bcvRate?: number;
  bcvLastSynced?: string;
  bcvRateDate?: string;
  secondaryCurrencyCode: CurrencyCode;
  secondaryCurrencySymbol: string;
  secondaryCurrencyName: string;
  lastRateUpdate: string;
  autoAudioPush: boolean;
  city: string;
  categories?: CategoryConfig[];
}

export interface OwnerSession {
  authenticated: boolean;
  email: string | null;
  username?: string | null;
  token: string | null;
}

export interface WebSocketMessage {
  type: 'init' | 'order:new' | 'order:updated' | 'rate:updated' | 'config:updated' | 'products:updated' | 'ping' | 'pong';
  payload?: any;
}
