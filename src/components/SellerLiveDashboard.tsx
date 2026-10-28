import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  ExternalLink,
  Save,
  Zap,
  ShoppingBag,
  Sliders,
  DollarSign,
  Package,
  ShieldCheck,
  LogOut,
  ImageIcon,
  Store,
  Upload,
  Building2,
  Check,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatus, Product, StoreConfig, OwnerSession } from '../types';
import { formatUSD, formatSecondary } from '../utils/currency';
import { generateCustomerChatLink, buildWhatsAppMessage } from '../utils/whatsapp';
import { soundService } from '../utils/sound';
import { ProductManager } from './ProductManager';

interface SellerLiveDashboardProps {
  orders: Order[];
  products: Product[];
  config: StoreConfig;
  connected: boolean;
  ownerSession: OwnerSession;
  onUpdateRate: (newRate: number) => Promise<void>;
  onUpdateConfig: (updates: Partial<StoreConfig>) => Promise<void>;
  onSyncBCVRate?: () => Promise<any>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSimulateOrder: () => void;
  onAddProduct: (productData: Partial<Product>) => Promise<any>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<any>;
  onDeleteProduct: (id: string) => Promise<any>;
  onLogoutOwner: () => void;
}

export const SellerLiveDashboard: React.FC<SellerLiveDashboardProps> = ({
  orders,
  products,
  config,
  connected,
  ownerSession,
  onUpdateRate,
  onUpdateConfig,
  onSyncBCVRate,
  onUpdateOrderStatus,
  onSimulateOrder,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onLogoutOwner
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [storeNameInput, setStoreNameInput] = useState(config.storeName);
  const [logoUrlInput, setLogoUrlInput] = useState(config.logoUrl || '');
  const [bannerUrlInput, setBannerUrlInput] = useState(config.bannerImageUrl || '');
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);
  const [rateInput, setRateInput] = useState(config.baseExchangeRate.toString());
  const [phoneInput, setPhoneInput] = useState(config.whatsappNumber);
  const [rateSaving, setRateSaving] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const [isSyncingBCV, setIsSyncingBCV] = useState(false);
  const [bcvMessage, setBcvMessage] = useState<string | null>(null);
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Sync internal state when config updates via real-time WebSocket
  React.useEffect(() => {
    setStoreNameInput(config.storeName);
  }, [config.storeName]);

  React.useEffect(() => {
    setLogoUrlInput(config.logoUrl || '');
  }, [config.logoUrl]);

  React.useEffect(() => {
    setBannerUrlInput(config.bannerImageUrl || '');
  }, [config.bannerImageUrl]);

  React.useEffect(() => {
    setRateInput(config.baseExchangeRate.toString());
  }, [config.baseExchangeRate]);

  React.useEffect(() => {
    setPhoneInput(config.whatsappNumber);
  }, [config.whatsappNumber]);

  // Stats calculation
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pendiente').length;
  const totalRevenueUSD = orders.reduce((sum, o) => sum + o.totalUSD, 0);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeNameInput.trim()) return;
    setIdentitySaving(true);
    await onUpdateConfig({
      storeName: storeNameInput.trim(),
      logoUrl: logoUrlInput.trim(),
      bannerImageUrl: bannerUrlInput.trim()
    });
    setIdentitySaving(false);
    setIdentitySaved(true);
    setTimeout(() => setIdentitySaved(false), 2500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen seleccionada no debe superar los 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrlInput(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen de banner no debe superar los 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerUrlInput(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSyncBCV = async () => {
    if (!onSyncBCVRate) return;
    setIsSyncingBCV(true);
    setBcvMessage(null);
    try {
      const res = await onSyncBCVRate();
      setBcvMessage(`¡Tasa BCV sincronizada con éxito: Bs. ${res.rate.toFixed(2)} por USD!`);
      setRateInput(res.rate.toString());
    } catch (err: any) {
      setBcvMessage(err?.message || 'Error al conectar con la tasa oficial BCV');
    } finally {
      setIsSyncingBCV(false);
      setTimeout(() => setBcvMessage(null), 4000);
    }
  };

  const handleToggleAutoBCV = async (enabled: boolean) => {
    await onUpdateConfig({ autoSyncBCV: enabled });
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setRateSaving(true);
      await onUpdateRate(parsed);
      setRateSaving(false);
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.trim()) {
      await onUpdateConfig({ whatsappNumber: phoneInput.trim() });
    }
  };

  const handleEnablePush = async () => {
    const granted = await soundService.requestNotificationPermission();
    setNotificationsAllowed(granted);
    if (granted) {
      soundService.triggerNativePush(
        '🔔 Notificaciones Push Activas',
        'Recibirás alertas instantáneas cada vez que un cliente realice un pedido 24/7.'
      );
    }
  };

  const handleTestChime = () => {
    soundService.playOrderChime();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Status Overview */}
      <div className="bg-stone-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-stone-800 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CANAL PUSH 24/7 EN VIVO
              </span>
              {ownerSession.authenticated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-stone-800 text-stone-200 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Propietario: {ownerSession.username || 'PETTER1420'}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nube Activa (Sincronizado en Todos tus Equipos)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Panel de Administración y Control 24/7
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Monitorea pedidos entrantes al instante, agrega nuevos productos y ajusta los precios en USD ($) con sincronización en vivo a todos los clientes.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTestChime}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 border border-stone-700"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Probar Sonido</span>
            </button>

            {!notificationsAllowed && (
              <button
                onClick={handleEnablePush}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 border border-stone-700"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Activar Push</span>
              </button>
            )}

            <button
              onClick={onSimulateOrder}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-stone-950" />
              <span>Simular Pedido</span>
            </button>

            {ownerSession.authenticated && (
              <button
                onClick={onLogoutOwner}
                className="px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-800 transition-colors flex items-center gap-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Recepción de Pedidos ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Gestión de Productos & Precios ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Nombre, Logo & Tasa BCV</span>
        </button>
      </div>

      {/* Tab 1: Orders View */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-xs font-medium text-stone-500 mb-1">Pedidos Recibidos Hoy</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {totalOrders}
                </span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {pendingOrders} pendientes
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-xs font-medium text-stone-500 mb-1">Volumen Total en USD</div>
              <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {formatUSD(totalRevenueUSD)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-xs font-medium text-stone-500 mb-1">Volumen en {config.secondaryCurrencyName}</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {formatSecondary(totalRevenueUSD, config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-xs font-medium text-stone-500 mb-1">Tasa Bimonetaria Vigente</div>
              <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Live Orders Feed Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Historial de Pedidos en Vivo ({orders.length})
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Los nuevos pedidos entran arriba automáticamente con alerta auditiva.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2 stroke-1" />
                <p className="text-sm font-semibold text-stone-700">No hay pedidos registrados aún</p>
                <p className="text-xs text-stone-500 mt-1">
                  Usa el botón "Simular Pedido" para probar la recepción en vivo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-stone-200">
                  <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Código / Hora</th>
                      <th className="py-3 px-4">Cliente & Teléfono</th>
                      <th className="py-3 px-4">Productos</th>
                      <th className="py-3 px-4 text-right">Total USD</th>
                      <th className="py-3 px-4 text-right">Total {config.secondaryCurrencyCode}</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acción WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {orders.map((order) => {
                      const customerChatUrl = generateCustomerChatLink(order.customerPhone, order.orderNumber);
                      const isRecent = Date.now() - new Date(order.createdAt).getTime() < 1000 * 60 * 5;

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-stone-50 transition-colors ${
                            isRecent ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-stone-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{order.customerName}</div>
                            <div className="text-[11px] font-mono text-stone-500">{order.customerPhone}</div>
                            {order.customerAddress && (
                              <div className="text-[11px] text-stone-500 truncate max-w-xs" title={order.customerAddress}>
                                {order.customerAddress}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5 max-w-xs">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="truncate text-stone-700">
                                  <span className="font-semibold">{it.quantity}x</span> {it.name}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-stone-900 tabular-nums">
                            {formatUSD(order.totalUSD)}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-emerald-700 tabular-nums">
                            {formatSecondary(order.totalUSD, order.exchangeRateUsed, order.secondaryCurrencySymbol, order.secondaryCurrencyCode)}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className={`text-[11px] font-semibold rounded-md px-2 py-1 border transition-colors ${
                                order.status === 'pendiente'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : order.status === 'preparando'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : order.status === 'en_camino'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="preparando">En Preparación</option>
                              <option value="en_camino">En Camino / Delivery</option>
                              <option value="completado">Completado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActiveOrderModal(order)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                                title="Ver Comprobante Completo"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={customerChatUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="Contactar al cliente por WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Chat</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Products & Live Price Management */}
      {activeTab === 'products' && (
        <ProductManager
          products={products}
          config={config}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Tab 3: Settings & Identity (Nombre, Logo & Tasa BCV) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Section 1: Store Identity (App Name & Logo) */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    Identidad de la Aplicación (Nombre & Logo)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Personaliza el nombre de tu tienda y el logotipo visible para todos los clientes en la cabecera y en los pedidos.
                  </p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 flex items-center gap-2.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Vista Previa:
                </span>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                  {logoUrlInput ? (
                    <img
                      src={logoUrlInput}
                      alt="Logo preview"
                      className="w-7 h-7 object-contain rounded bg-stone-50 border border-stone-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                      24<span className="text-emerald-400">/7</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-stone-900 truncate max-w-[140px]">
                    {storeNameInput || 'Nombre de la Tienda'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveIdentity} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Store Name Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Nombre de la Aplicación / Catálogo
                  </label>
                  <input
                    type="text"
                    required
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    placeholder="Ej. VentaDirecta 24/7 o Mi Tienda Caracas"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold text-stone-900 bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-stone-900 transition-colors"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Aparecerá en el encabezado, título de la pestaña y mensajes de WhatsApp.
                  </p>
                </div>

                {/* Logo Image URL & Upload */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                    <span>Logotipo de la Tienda</span>
                    <span className="text-[11px] font-normal text-stone-400">URL o Subir archivo</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/logo.png o sube una imagen"
                      className="flex-1 px-3.5 py-2.5 text-xs font-mono text-stone-900 bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-stone-900 transition-colors"
                    />
                    <label className="cursor-pointer px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 border border-stone-200">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-stone-400">Presets rápidos:</span>
                    <button
                      type="button"
                      onClick={() => setLogoUrlInput('')}
                      className="text-[11px] text-stone-600 hover:text-stone-900 underline"
                    >
                      Restablecer Monograma 24/7
                    </button>
                  </div>
                </div>

                {/* Banner Background Image URL & Upload */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                    <span>Imagen de Fondo del Banner / Cabecera (Hero Banner)</span>
                    <span className="text-[11px] font-normal text-stone-400">URL o Subir archivo</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bannerUrlInput}
                      onChange={(e) => setBannerUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/banner-bodega.jpg o sube una imagen"
                      className="flex-1 px-3.5 py-2.5 text-xs font-mono text-stone-900 bg-stone-50/50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-stone-900 transition-colors"
                    />
                    <label className="cursor-pointer px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 border border-stone-200">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">Subir Banner</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {bannerUrlInput && (
                    <div className="mt-2.5 relative h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 shadow-2xs">
                      <img
                        src={bannerUrlInput}
                        alt="Vista previa del banner"
                        className="w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2.5">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Vista previa de la imagen de fondo activa
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] text-stone-400">Opciones rápidas:</span>
                    <button
                      type="button"
                      onClick={() => setBannerUrlInput('')}
                      className="text-[11px] text-stone-600 hover:text-stone-900 underline"
                    >
                      Quitar imagen (usar degradado elegante)
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => setBannerUrlInput('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80')}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Preset: Supermercado Moderno
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => setBannerUrlInput('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80')}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Preset: Despensa & Víveres
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Identity */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-500">
                  {identitySaved ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> ¡Nombre, logo y banner actualizados con éxito en vivo!
                    </span>
                  ) : (
                    'Los cambios se sincronizan en vivo para todos los visitantes al guardar.'
                  )}
                </span>
                <button
                  type="submit"
                  disabled={identitySaving}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{identitySaving ? 'Guardando...' : identitySaved ? '¡Guardado!' : 'Guardar Datos y Banner'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Banco Central de Venezuela (BCV) Live Rate Sync */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">
                      Tasa Oficial del Banco Central de Venezuela (BCV)
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      BCV EN VIVO
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Precios bimonetarios sincronizados directamente con la cotización oficial del BCV.
                  </p>
                </div>
              </div>

              {/* Primary BCV Sync Action */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncBCV}
                  disabled={isSyncingBCV}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBCV ? 'animate-spin' : ''}`} />
                  <span>{isSyncingBCV ? 'Consultando BCV...' : 'Sincronizar con BCV Ahora'}</span>
                </button>
              </div>
            </div>

            {/* BCV Status Banner */}
            {bcvMessage && (
              <div className="p-3.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bcvMessage}</span>
              </div>
            )}

            {/* Rate KPI Hero Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-900 text-white md:col-span-1 shadow-xs">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Tasa Vigente en Tienda
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
                  Bs. {config.baseExchangeRate.toFixed(2)}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  1 USD = {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)} {config.secondaryCurrencyCode}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 md:col-span-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-semibold">Fuente Oficial:</span>
                    <span className="font-mono text-stone-900 font-bold">Banco Central de Venezuela (Oficial)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-semibold">Fecha Reportada por BCV:</span>
                    <span className="font-mono text-stone-700">{config.bcvRateDate || 'Fecha del día'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-semibold">Última Sincronización:</span>
                    <span className="font-mono text-stone-700">
                      {new Date(config.lastRateUpdate).toLocaleDateString()} {new Date(config.lastRateUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Auto Sync Toggle */}
                <div className="pt-3 mt-3 border-t border-stone-200 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoSyncBCV !== false}
                      onChange={(e) => handleToggleAutoBCV(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-stone-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-stone-800">
                      Actualizar automáticamente con la tasa oficial BCV cada 30 minutos
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {config.autoSyncBCV !== false ? 'Activo 24/7' : 'Desactivado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Rate Override (Optional Fallback) */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Ajuste Manual o Margen Especial (Opcional)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Si deseas establecer temporalmente un valor manual distinto a la cotización automática del BCV.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveRate} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-semibold text-stone-500">
                      {config.secondaryCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rateSaving}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{rateSaving ? 'Guardando...' : rateSaved ? '¡Actualizado!' : 'Fijar Tasa Manual'}</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Ajustes rápidos:</span>
                  {[config.bcvRate || 876.80, 850.0, 870.0, 880.0, 900.0].map((preset, idx) => (
                    <button
                      key={`${preset}-${idx}`}
                      type="button"
                      onClick={() => setRateInput(Number(preset).toFixed(2))}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 rounded text-stone-700 font-mono text-[11px] transition-colors"
                    >
                      Bs. {Number(preset).toFixed(2)}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </div>

          {/* Section 3: WhatsApp Store Number & Direct Reception */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                Número de WhatsApp para Recepción Directa de Pedidos
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Número del propietario donde se envían las órdenes 24/7. <strong>Tu número no se expone al cliente</strong>: al dar clic en la bolsa de pedidos, la orden se transfiere de inmediato a tu chat.
            </p>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp Receptor
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="04140978185"
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="self-end">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Guardar Número</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-stone-500">
                <span>Configurado actualmente para: </span>
                <strong className="font-mono text-stone-800">{config.whatsappNumber}</strong>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Full Receipt Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-mono text-stone-500">Orden de Compra</span>
                <h3 className="text-lg font-bold text-stone-900">#{activeOrderModal.orderNumber}</h3>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="text-stone-400 hover:text-stone-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div><strong>Cliente:</strong> {activeOrderModal.customerName}</div>
              <div><strong>Teléfono:</strong> {activeOrderModal.customerPhone}</div>
              <div><strong>Entrega:</strong> {activeOrderModal.deliveryMethod}</div>
              {activeOrderModal.customerAddress && <div><strong>Dirección:</strong> {activeOrderModal.customerAddress}</div>}
              <div><strong>Método de Pago:</strong> {activeOrderModal.paymentMethod}</div>
              <div><strong>Tasa Usada:</strong> {activeOrderModal.secondaryCurrencySymbol} {activeOrderModal.exchangeRateUsed.toFixed(2)}</div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700">Mensaje generado para WhatsApp:</span>
              <pre className="text-[11px] font-mono bg-stone-900 text-stone-200 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap">
                {buildWhatsAppMessage(activeOrderModal)}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveOrderModal(null)}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200"
              >
                Cerrar
              </button>
              <a
                href={generateCustomerChatLink(activeOrderModal.customerPhone, activeOrderModal.orderNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Abrir Chat de WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
