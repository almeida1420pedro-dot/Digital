import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Bell,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  DollarSign,
  Lock,
  Sparkles,
  Calculator,
  Grid,
  Store,
  ChevronRight,
  Landmark,
  CreditCard,
  Package,
  Milk,
  Coffee,
  Fish,
  Utensils,
  Layers,
  Search,
  X,
  Smartphone,
  Download
} from 'lucide-react';
import { useRealtime } from './hooks/useRealtime';
import { Product, CartItem, CurrencyDisplayMode, Order, CategoryConfig } from './types';
import { Header } from './components/Header';
import { ExchangeRateBar } from './components/ExchangeRateBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { SellerLiveDashboard } from './components/SellerLiveDashboard';
import { CurrencyCalculatorModal } from './components/CurrencyCalculatorModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CompactInstallCard } from './components/CompactInstallCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { formatUSD, formatSecondary } from './utils/currency';
import { generateWhatsAppLink, formatWhatsAppPhone } from './utils/whatsapp';

interface CategoryInfo {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  badgeText: string;
  description: string;
  imageUrl?: string;
}

const CATEGORY_META: Record<string, CategoryInfo> = {
  all: {
    name: 'Todo el Supermercado',
    icon: Store,
    color: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-700',
    badgeText: 'Catálogo Completo',
    description: 'Víveres, despensa, lácteos y enlatados'
  },
  'Víveres & Despensa': {
    name: 'Víveres & Despensa',
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-800',
    badgeText: 'Harina, Arroz, Pasta, Aceite',
    description: 'Víveres esenciales para la cocina'
  },
  'Lácteos & Refrigerados': {
    name: 'Lácteos & Quesos',
    icon: Milk,
    color: 'from-sky-500 to-blue-600',
    textColor: 'text-sky-800',
    badgeText: 'Leche en Polvo, Queso Llanero',
    description: 'Frescos y tradicionales'
  },
  'Café & Desayuno': {
    name: 'Café & Desayuno',
    icon: Coffee,
    color: 'from-amber-800 to-stone-900',
    textColor: 'text-amber-900',
    badgeText: 'Café Molido Gourmet',
    description: 'Aroma y calidad tostada'
  },
  'Enlatados & Conservas': {
    name: 'Enlatados & Pescados',
    icon: Fish,
    color: 'from-cyan-600 to-blue-700',
    textColor: 'text-blue-800',
    badgeText: 'Atún en Aceite',
    description: 'Proteínas listas para preparar'
  },
  'Salsas & Condimentos': {
    name: 'Salsas & Condimentos',
    icon: Utensils,
    color: 'from-rose-500 to-red-600',
    textColor: 'text-rose-800',
    badgeText: 'Mayonesa Cremosa',
    description: 'El mejor toque para tus platos'
  },
  'Salsas & Aderezos': {
    name: 'Salsas & Aderezos',
    icon: Utensils,
    color: 'from-rose-500 to-red-600',
    textColor: 'text-rose-800',
    badgeText: 'Mayonesa Cremosa',
    description: 'El mejor toque para tus platos'
  }
};

const getCategoryInfo = (cat: string, customCategories?: CategoryConfig[]): CategoryInfo => {
  const custom = customCategories?.find(
    (c) => c.name.toLowerCase() === cat.toLowerCase() || c.id === cat
  );

  const fallbackMeta = CATEGORY_META[cat] || {
    name: cat === 'all' ? 'Todo el Supermercado' : cat,
    icon: Store,
    color: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-700',
    badgeText: 'Supermercado 24/7',
    description: 'Productos de calidad'
  };

  if (custom) {
    return {
      name: custom.name || fallbackMeta.name,
      icon: fallbackMeta.icon,
      color: custom.color || fallbackMeta.color,
      textColor: fallbackMeta.textColor,
      badgeText: custom.badgeText || fallbackMeta.badgeText,
      description: custom.description || fallbackMeta.description,
      imageUrl: custom.imageUrl
    };
  }

  return fallbackMeta;
};

export default function App() {
  const {
    config,
    products,
    orders,
    connected,
    latestPushOrder,
    ownerSession,
    loginOwner,
    logoutOwner,
    addProduct,
    updateProduct,
    deleteProduct,
    clearLatestPushOrder,
    updateRate,
    updateConfig,
    syncBCVRate,
    submitOrder,
    updateOrderStatus
  } = useRealtime();

  // Dynamically synchronize HTML document title with custom app name
  React.useEffect(() => {
    if (config.storeName) {
      document.title = `${config.storeName} - Catálogo Digital 24/7`;
    }
  }, [config.storeName]);

  // Navigation & View State
  const [activeView, setActiveView] = useState<'catalog' | 'seller_dashboard'>('catalog');
  const [currencyMode, setCurrencyMode] = useState<CurrencyDisplayMode>('dual');

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [successWhatsAppUrl, setSuccessWhatsAppUrl] = useState('');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Category and Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('Víveres & Despensa');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Categories list with counts (excluding 'all' and empty entries)
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category !== 'all') {
        set.add(p.category);
      }
    });
    return Array.from(set);
  }, [products]);

  // Keep selectedCategory valid if categories change
  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const isSearching = searchQuery.trim().length > 0;

  // Filtered products: if searching, filter by name (and description/category) across ALL categories; otherwise by selected category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory, searchQuery]);

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleDirectWhatsAppFromProduct = (product: Product, quantity = 1) => {
    const singleOrderPayload: Partial<Order> = {
      customerName: 'Cliente Catálogo Web',
      customerPhone: 'Contacto por WhatsApp',
      deliveryMethod: 'delivery_express',
      paymentMethod: 'pago_movil',
      items: [
        {
          productId: product.id,
          name: product.name,
          quantity,
          priceUSD: product.priceUSD,
          priceSecondary: product.priceUSD * config.baseExchangeRate
        }
      ],
      subtotalUSD: product.priceUSD * quantity,
      subtotalSecondary: product.priceUSD * quantity * config.baseExchangeRate,
      totalUSD: product.priceUSD * quantity,
      totalSecondary: product.priceUSD * quantity * config.baseExchangeRate,
      exchangeRateUsed: config.baseExchangeRate,
      secondaryCurrencySymbol: config.secondaryCurrencySymbol,
      secondaryCurrencyCode: config.secondaryCurrencyCode,
      notes: `Pedido directo de ${quantity} unidad(es) de ${product.name}`
    };

    submitOrder(singleOrderPayload).then((created) => {
      const url = generateWhatsAppLink(config.whatsappNumber, created);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setSuccessOrder(created);
      setSuccessWhatsAppUrl(url);
      setSelectedProduct(null);
    });
  };

  const handleSimulateOrder = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)] || products[0];
    const testNames = ['Alejandro Vegas', 'Valeria Castillo', 'Gabriel Rivas', 'Daniela Morales'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomQty = Math.floor(Math.random() * 2) + 1;

    const testPayload: Partial<Order> = {
      customerName: randomName,
      customerPhone: `+58 412 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      customerAddress: 'Av. Libertador, Torre Xerox, Piso 4, Caracas',
      deliveryMethod: 'delivery_express',
      paymentMethod: 'pago_movil',
      notes: 'Pedido generado mediante simulación de prueba en vivo 24/7',
      items: [
        {
          productId: randomProduct.id,
          name: randomProduct.name,
          quantity: randomQty,
          priceUSD: randomProduct.priceUSD,
          priceSecondary: randomProduct.priceUSD * config.baseExchangeRate
        }
      ],
      subtotalUSD: randomProduct.priceUSD * randomQty,
      subtotalSecondary: randomProduct.priceUSD * randomQty * config.baseExchangeRate,
      totalUSD: randomProduct.priceUSD * randomQty,
      totalSecondary: randomProduct.priceUSD * randomQty * config.baseExchangeRate,
      exchangeRateUsed: config.baseExchangeRate,
      secondaryCurrencySymbol: config.secondaryCurrencySymbol,
      secondaryCurrencyCode: config.secondaryCurrencyCode
    };

    submitOrder(testPayload);
  };

  const handleScrollToCategories = () => {
    setActiveView('catalog');
    setTimeout(() => {
      const el = document.getElementById('categorias');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartUSD = cartItems.reduce((acc, item) => acc + item.product.priceUSD * item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20 sm:pb-0">
      
      {/* 1. Modern Glassmorphic Header */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        currencyMode={currencyMode}
        setCurrencyMode={setCurrencyMode}
        config={config}
        connected={connected}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        ownerSession={ownerSession}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogoutOwner={logoutOwner}
      />

      {/* 2. Sleek Live Exchange Rate Ticker (Integrated directly under header recuadro) */}
      <ExchangeRateBar config={config} />

      {/* Push Alert Notification Banner */}
      {latestPushOrder && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-emerald-600 text-white px-4 py-2 text-xs shadow-md animate-in slide-in-from-top duration-300 relative z-30"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-700 rounded-full animate-bounce">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold">
                ¡Nuevo Pedido #{latestPushOrder.orderNumber}!
              </span>
              <span className="hidden sm:inline">
                {latestPushOrder.customerName} realizó una orden por {formatUSD(latestPushOrder.totalUSD)} ({formatSecondary(latestPushOrder.totalUSD, latestPushOrder.exchangeRateUsed, latestPushOrder.secondaryCurrencySymbol, latestPushOrder.secondaryCurrencyCode)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (ownerSession.authenticated) {
                    setActiveView('seller_dashboard');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                  clearLatestPushOrder();
                }}
                className="px-2.5 py-1 bg-white text-emerald-900 font-bold rounded-lg text-[11px] hover:bg-stone-100 transition-colors"
              >
                Ver en Panel
              </button>
              <button
                onClick={clearLatestPushOrder}
                className="p-1 text-white/80 hover:text-white"
                aria-label="Cerrar alerta"
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'seller_dashboard' && ownerSession.authenticated ? (
          /* Merchant / Owner Dashboard */
          <SellerLiveDashboard
            orders={orders}
            products={products}
            config={config}
            connected={connected}
            ownerSession={ownerSession}
            onUpdateRate={updateRate}
            onUpdateConfig={updateConfig}
            onSyncBCVRate={syncBCVRate}
            onUpdateOrderStatus={updateOrderStatus}
            onSimulateOrder={handleSimulateOrder}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onLogoutOwner={logoutOwner}
          />
        ) : (
          /* Public Storefront 24/7 Catalog */
          <div>
            {/* Visual Hero Banner with High Attraction & Customizable Background Banner */}
            <section className="relative overflow-hidden text-white border-b border-stone-800 min-h-[200px] sm:min-h-[250px] flex items-center">
              {/* Optional Admin-configurable Background Image */}
              {config.bannerImageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                  style={{ backgroundImage: `url(${config.bannerImageUrl})` }}
                >
                  {/* High contrast gradient overlay so text is 100% visible on mobile and desktop */}
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/85 to-stone-950/75" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/50" />
                </div>
              ) : (
                /* Default rich gradient */
                <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-emerald-950/80 to-stone-900">
                  <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
                </div>
              )}

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-6 sm:py-10">
                <div className="max-w-2xl">
                  
                  {/* Clean kicker tag */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-semibold mb-2.5 text-xs shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Catálogo Oficial 24/7 · Despachos Inmediatos</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                    {config.storeName ? config.storeName : 'Catálogo Digital'}
                    <span className="block text-emerald-400 font-bold text-xs sm:text-base lg:text-lg mt-1 tracking-normal">
                      Supermercado & Víveres · Precios en USD y Tasa BCV
                    </span>
                  </h1>

                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm mt-2.5 font-normal max-w-xl drop-shadow-xs">
                    Víveres, despensa, lácteos y productos frescos de primera calidad. Selecciona cantidades en vivo y pide directo a WhatsApp con entrega rápida.
                  </p>

                  {/* Quick Action Badges / CTAs */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <a
                      href="#categorias"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <span>Ver Categorías</span>
                      <ChevronRight className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => setIsCalculatorOpen(true)}
                      className="px-4 py-2 bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
                    >
                      <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Calculadora BCV</span>
                    </button>
                  </div>

                </div>
              </div>
            </section>

            {/* Interactive Supermarket Categories Hub with Icons */}
            <section id="categorias" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-2">
              
              {/* Search Bar at the top of category section (Filters across all categories) */}
              <div className="mb-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre en todo el supermercado (ej: Harina, Arroz, Café, Leche, Atún)..."
                    className="w-full pl-11 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 placeholder:text-stone-400 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                      title="Borrar búsqueda"
                      aria-label="Borrar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isSearching && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        Buscando en todo el supermercado: <strong className="text-stone-900 font-semibold">"{searchQuery}"</strong>
                      </span>
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-200/60">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3.5 sm:mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Layers className="w-3 h-3 text-emerald-700" />
                    <span>Departamentos del Supermercado</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Explora por Categorías</span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    Toca un departamento para entrar y visualizar sus productos disponibles
                  </p>
                </div>
              </div>

              {/* Responsive Category Grid with Large Touch Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {categories.map((cat) => {
                  const info = getCategoryInfo(cat, config.categories);
                  const Icon = info.icon;
                  const isSelected = selectedCategory === cat;
                  const count = products.filter((p) => p.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      style={{ height: '120.5px' }}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(cat);
                        const el = document.getElementById('catalogo');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`group relative text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                        isSelected && !isSearching
                          ? 'ring-2 ring-emerald-600 bg-emerald-50/70 shadow-md border-emerald-500 scale-[1.02]'
                          : 'bg-white hover:bg-stone-50 border-stone-200/90 hover:border-stone-300 shadow-2xs hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {info.imageUrl ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-xs border border-stone-200/90 shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center p-0.5">
                            <img
                              src={info.imageUrl}
                              alt={info.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                          }`}
                        >
                          {count}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight group-hover:text-emerald-700 transition-colors">
                          {info.name}
                        </h3>
                        <p className="text-[10px] text-stone-500 leading-tight mt-1 line-clamp-1">
                          {info.badgeText}
                        </p>
                      </div>

                      {isSelected ? (
                        <div className="mt-2 pt-1.5 border-t border-emerald-200 flex items-center justify-between text-[10px] font-bold text-emerald-700">
                          <span>Visualizando</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        </div>
                      ) : (
                        <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center gap-1 text-[10px] font-medium text-stone-400 group-hover:text-emerald-700 transition-colors">
                          <span>Entrar</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Catalog Section */}
            <section id="catalogo" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
              
              {/* Category Pills Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => {
                  const info = getCategoryInfo(cat, config.categories);
                  const Icon = info.icon;
                  const count = products.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(cat);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-2 ${
                        isSelected && !isSearching
                          ? 'bg-emerald-700 text-white shadow-xs font-bold ring-2 ring-emerald-500'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs'
                      }`}
                    >
                      {info.imageUrl ? (
                        <img
                          src={info.imageUrl}
                          alt=""
                          className="w-4 h-4 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <Icon className="w-4 h-4 shrink-0" />
                      )}
                      <span>{info.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected && !isSearching ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Category or Search Results Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-3">
                  {isSearching ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                  ) : (() => {
                    const info = getCategoryInfo(selectedCategory, config.categories);
                    const Icon = info.icon;
                    return info.imageUrl ? (
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-xs border border-emerald-300 shrink-0 p-0.5">
                        <img
                          src={info.imageUrl}
                          alt={info.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        {isSearching ? 'Búsqueda en todo el Catálogo' : 'Categoría Seleccionada'}
                      </span>
                      {isSearching && (
                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          Todas las categorías
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-tight">
                      {isSearching ? `Resultados para "${searchQuery}"` : getCategoryInfo(selectedCategory, config.categories).name}
                    </h3>
                    <p className="text-[11px] text-stone-600">
                      {isSearching
                        ? `Mostrando ${filteredProducts.length} ${filteredProducts.length === 1 ? 'producto' : 'productos'} encontrados en todo el supermercado`
                        : `Mostrando ${filteredProducts.length} ${filteredProducts.length === 1 ? 'producto' : 'productos'} en este departamento`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSearching && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar Búsqueda</span>
                    </button>
                  )}
                  <span className="font-mono text-xs text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold shadow-2xs">
                    Tasa: {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)} / USD
                  </span>
                </div>
              </div>

              {/* Products Rendering for Selected Category or Search Results */}
              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/80 p-6">
                  {isSearching ? (
                    <>
                      <Search className="w-10 h-10 text-stone-300 mx-auto mb-3 stroke-1" />
                      <p className="text-sm font-bold text-stone-800">
                        No se encontraron productos para "{searchQuery}"
                      </p>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        Intenta con otra palabra clave (por ejemplo: Harina, Arroz, Café, Leche) o selecciona una categoría directamente.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Ver todas las categorías</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Package className="w-10 h-10 text-stone-300 mx-auto mb-3 stroke-1" />
                      <p className="text-sm font-bold text-stone-800">No hay productos en esta categoría</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        Selecciona otra categoría arriba para ver los productos disponibles.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div
                  style={{ backgroundColor: '#c8ebe6' }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-3.5 p-2 sm:p-3 rounded-2xl"
                >
                  {filteredProducts.map((product) => {
                    const cartItem = cartItems.find((i) => i.product.id === product.id);
                    const currentQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        config={config}
                        currencyMode={currencyMode}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        cartQuantity={currentQty}
                        onUpdateCartQuantity={(p, q) => handleUpdateCartQuantity(p.id, q)}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Trust and Fast Delivery Features */}
            <section className="bg-white border-t border-stone-200/80 py-10 sm:py-14 mt-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  
                  <a
                    href="https://www.tiktok.com/@almeida.petter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200/60 hover:border-stone-300 transition-all shadow-2xs hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-950 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                          TikTok Oficial
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        @almeida.petter
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                        Síguenos en TikTok para ver demostraciones de productos, videos de clientes y novedades en tiempo real.
                      </p>
                    </div>
                  </a>

                  <div className="flex flex-col p-4 rounded-2xl bg-stone-50 border border-stone-200/60 justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 leading-tight">
                            Métodos de Pago Aceptados
                          </h3>
                          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            ¡Aceptamos todas las opciones para tu comodidad!
                          </p>
                        </div>
                      </div>

                      {/* Payment Methods Badges with Logos */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {/* 1. Pago Móvil */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs hover:border-indigo-300 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                              <path d="M12 18h.01M9 7h6"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-stone-900 block leading-tight truncate">Pago Móvil</span>
                            <span className="text-[9px] text-indigo-600 font-semibold block leading-none">Bs. Oficial</span>
                          </div>
                        </div>

                        {/* 2. Transferencia */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs hover:border-stone-400 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Landmark className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-stone-900 block leading-tight truncate">Transferencia</span>
                            <span className="text-[9px] text-stone-500 block leading-none">Bancos Nac.</span>
                          </div>
                        </div>

                        {/* 3. Divisas Efectivo */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs hover:border-emerald-300 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-sm">
                            $
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-stone-900 block leading-tight truncate">Divisas Efectivo</span>
                            <span className="text-[9px] text-emerald-700 font-semibold block leading-none">Dólares USD</span>
                          </div>
                        </div>

                        {/* 4. USDT */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs hover:border-teal-300 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-[#26A17B] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
                              <circle cx="16" cy="16" r="15" fill="#26A17B"/>
                              <path d="M18.9 12.2h3.2v-2.4H9.9v2.4h3.2v2c-3.7.2-6.5.9-6.5 1.8s2.8 1.6 6.5 1.8v6.8h3.8v-6.8c3.7-.2 6.5-.9 6.5-1.8s-2.8-1.6-6.5-1.8v-2z" fill="#FFFFFF"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-stone-900 block leading-tight truncate">USDT</span>
                            <span className="text-[9px] text-teal-700 font-semibold block leading-none">Binance Pay</span>
                          </div>
                        </div>

                        {/* 5. Punto de Venta */}
                        <div className="col-span-2 flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 border border-amber-300 shadow-2xs hover:border-amber-400 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="4" y="3" width="16" height="18" rx="2"/>
                              <rect x="7" y="6" width="10" height="4" rx="1"/>
                              <path d="M7 13h2M11 13h2M15 13h2M7 16h2M11 16h2M15 16h2M10 19h4"/>
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-stone-900 block leading-tight">Punto de Venta (POS)</span>
                              <span className="text-[9px] text-amber-800 font-medium block leading-none">Tarjetas de Débito y Crédito</span>
                            </div>
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                              ¡Tenemos Punto!
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Dedicated Compact & Elegant App Installation Card at the End of the App */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-2">
              <CompactInstallCard
                config={config}
                onOpenInstructions={() => setIsInstallModalOpen(true)}
              />
            </section>
          </div>
        )}
      </main>

      {/* Floating Sticky Mobile Cart Summary Banner (When cart has items) */}
      {cartItems.length > 0 && activeView === 'catalog' && (
        <aside
          role="region"
          aria-label="Resumen de pedido móvil"
          className="sm:hidden fixed bottom-18 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-200"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-500/30 active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center font-mono">
                {totalCartCount}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Ver mi pedido</div>
                <div className="text-[10px] text-stone-400">Toca para finalizar en WhatsApp</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-xs text-emerald-400">{formatUSD(totalCartUSD)}</div>
              <div className="font-mono text-[10px] text-stone-300">
                {formatSecondary(totalCartUSD, config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
              </div>
            </div>
          </button>
        </aside>
      )}

      {/* Modern App-Style Mobile Bottom Navigation Bar (Dock) */}
      <nav
        aria-label="Navegación móvil"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/90 shadow-2xl px-2 py-1.5 flex items-center justify-around"
      >
        <button
          onClick={() => setActiveView('catalog')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeView === 'catalog' ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Catálogo</span>
        </button>

        <button
          onClick={handleScrollToCategories}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-[10px] font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <Layers className="w-5 h-5 text-emerald-600" />
          <span>Categorías</span>
        </button>

        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-[10px] font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <Calculator className="w-5 h-5 text-emerald-600" />
          <span>Tasa BCV</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-[10px] font-semibold text-stone-500 hover:text-stone-900 transition-colors relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-in zoom-in-50">
                {totalCartCount}
              </span>
            )}
          </div>
          <span>Mi Pedido</span>
        </button>

        <button
          onClick={() => {
            if (ownerSession.authenticated) {
              setActiveView('seller_dashboard');
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeView === 'seller_dashboard' ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          {ownerSession.authenticated ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          <span>Propietario</span>
        </button>
      </nav>

      {/* Modals & Slide-overs */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        config={config}
        onSubmitOrder={submitOrder}
        onOrderSuccess={(order, waUrl) => {
          setIsCartOpen(false);
          setSuccessOrder(order);
          setSuccessWhatsAppUrl(waUrl);
        }}
      />

      <ProductModal
        product={selectedProduct}
        config={config}
        currencyMode={currencyMode}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onDirectWhatsApp={handleDirectWhatsAppFromProduct}
      />

      <CurrencyCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        config={config}
      />

      <OrderSuccessModal
        order={successOrder}
        whatsappUrl={successWhatsAppUrl}
        onClose={() => setSuccessOrder(null)}
      />

      <OwnerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={loginOwner}
        onSuccess={() => {
          setActiveView('seller_dashboard');
        }}
      />

      {/* PWA Mobile Installation Instructions & Trigger Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        config={config}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Clean Modern Footer */}
      {/* Clean Modern Responsive Footer */}
      <footer
        style={{ backgroundColor: '#0a2616', height: '172.328px' }}
        className="w-full bg-stone-950 text-stone-400 text-xs py-8 border-t border-stone-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: '#0a2616' }}
              className="font-bold text-white tracking-tight"
            >
              {config.storeName}
            </span>
            <span>·</span>
            <span>Catálogo Público Digital 24/7</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-stone-400">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar en Móvil</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Calculadora de Tasa
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (ownerSession.authenticated) {
                  setActiveView('seller_dashboard');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {ownerSession.authenticated ? 'Panel Propietario' : 'Acceso Propietario'}
            </button>
            <span>·</span>
            <a
              href="https://www.tiktok.com/@almeida.petter"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              TikTok @almeida.petter
            </a>
          </div>

          <div
            style={{ backgroundColor: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }}
            className="text-[11px] text-stone-500 font-mono"
          >
            Tasa activa: {config.secondaryCurrencySymbol} {config.baseExchangeRate.toFixed(2)} / USD
          </div>
        </div>
      </footer>

      {/* Interactive Sticky Floating Cart Bar when groceries are in cart */}
      {totalCartCount > 0 && activeView === 'catalog' && (
        <div className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:right-6 z-40 max-w-md mx-auto sm:mx-0 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto bg-stone-900 hover:bg-emerald-600 text-white p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl shadow-stone-950/40 flex items-center justify-between sm:justify-start gap-4 border border-stone-700/80 hover:border-emerald-500/80 transition-all active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Tu Pedido de Supermercado</span>
                  <span className="bg-emerald-500 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {totalCartCount}
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 font-mono mt-0.5">
                  {formatUSD(totalCartUSD)} · {formatSecondary(totalCartUSD, config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-white text-stone-950 group-hover:bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0 transition-colors">
              <span>Ver Pedido</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
}
