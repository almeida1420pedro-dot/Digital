import type { Product, StoreConfig } from '../types.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    name: 'Harina de Maíz Blanco Precocida 1kg',
    slug: 'harina-maiz-blanco-1kg',
    category: 'Víveres & Despensa',
    priceUSD: 1.25,
    stock: 45,
    image: '/src/assets/images/harina_pan_1792624719412.jpg',
    description: 'Harina de maíz blanco 100% puro para arepas, empanadas y hallacas. Libre de gluten, textura suave y cocción perfecta.',
    features: [
      '100% Maíz Blanco Seleccionado',
      'Libre de Gluten',
      'Ideal para Arepas, Empanadas y Bollos',
      'Presentación sellada de 1 Kilogramo'
    ],
    badge: 'Más Vendido',
    sku: 'VIV-HAR-001'
  },
  {
    id: 'prod-02',
    name: 'Arroz Blanco Grano Entero Tipo I 1kg',
    slug: 'arroz-blanco-grano-entero-1kg',
    category: 'Víveres & Despensa',
    priceUSD: 1.40,
    stock: 38,
    image: '/src/assets/images/arroz_grano_1792624719746.jpg',
    description: 'Arroz blanco seleccionado de grano largo, enriquecido con vitaminas. Cocción suelta, rendimiento óptimo y sabor tradicional.',
    features: [
      'Grano Entero Seleccionado Tipo I',
      'Cocción suelta garantizada',
      'Enriquecido con Hierro y Vitaminas B',
      'Empaque resistente de 1kg'
    ],
    badge: 'Básico Esencial',
    sku: 'VIV-ARR-002'
  },
  {
    id: 'prod-03',
    name: 'Pasta Spaghetti Especial de Trigo 1kg',
    slug: 'pasta-spaghetti-especial-1kg',
    category: 'Víveres & Despensa',
    priceUSD: 1.65,
    stock: 50,
    image: '/src/assets/images/pasta_spaghetti_1792624748145.jpg',
    description: 'Pasta larga elaborada con sémola de trigo duro de alta calidad. Al dente en 10 minutos, ideal con salsas y quesos.',
    features: [
      '100% Sémola de Trigo Duro',
      'Cocción Al Dente en 10-12 min',
      'Textura firme que no se rompe',
      'Empaque familiar de 1kg'
    ],
    badge: 'Oferta',
    sku: 'VIV-PAS-003'
  },
  {
    id: 'prod-04',
    name: 'Aceite Vegetal Comestible 1 Litro',
    slug: 'aceite-vegetal-comestible-1l',
    category: 'Víveres & Despensa',
    priceUSD: 2.75,
    stock: 30,
    image: '/src/assets/images/aceite_maiz_1792624762254.jpg',
    description: 'Aceite vegetal refinado, ideal para freír, guisar y hornear. Cero colesterol, ligero y de alto rendimiento en cocina.',
    features: [
      '100% Puro y Refinado',
      '0% Grasas Trans y Cero Colesterol',
      'Punto de humo ideal para frituras crujientes',
      'Botella ergonómica de 1 Litro'
    ],
    badge: 'Esencial',
    sku: 'VIV-ACE-004'
  },
  {
    id: 'prod-05',
    name: 'Café Tostado y Molido Gourmet 500g',
    slug: 'cafe-tostado-molido-500g',
    category: 'Café & Desayuno',
    priceUSD: 3.90,
    stock: 25,
    image: '/src/assets/images/cafe_molido_1792624733974.jpg',
    description: 'Café 100% arábica de tueste medio oscuro con aroma envolvente y notas achocolatadas. Molienda ideal para greca o filtro.',
    features: [
      'Granos 100% Arábica de Altura',
      'Tueste Medio Oscuro Aromático',
      'Empaque con válvula desgasificadora',
      'Contenido neto: 500 gramos'
    ],
    badge: 'Favorito',
    sku: 'DES-CAF-005'
  },
  {
    id: 'prod-06',
    name: 'Leche Completa en Polvo Instantánea 900g',
    slug: 'leche-completa-polvo-900g',
    category: 'Lácteos & Refrigerados',
    priceUSD: 8.50,
    stock: 20,
    image: '/src/assets/images/leche_polvo_1792624749238.jpg',
    description: 'Leche entera en polvo fortificada con Calcio y Vitaminas A y D. Rinde hasta 7 litros de leche cremosa y nutritiva.',
    features: [
      'Leche Entera 26% Grasa Natural',
      'Fortificada con Calcio y Vitaminas A y D',
      'Disolución instantánea en frío y caliente',
      'Lata protectora hermética 900g'
    ],
    badge: 'Nutrición',
    sku: 'LAC-LEC-006'
  },
  {
    id: 'prod-07',
    name: 'Queso Blanco Llanero Fresco 500g',
    slug: 'queso-blanco-llanero-500g',
    category: 'Lácteos & Refrigerados',
    priceUSD: 3.50,
    stock: 28,
    image: '/src/assets/images/queso_fresco_1792624762755.jpg',
    description: 'Auténtico queso blanco llanero fresco, salado en su punto justo. Textura ideal para rallar sobre arepas, empanadas y pasta.',
    features: [
      'Elaborado con 100% leche pasteurizada',
      'Salado en su punto tradicional llanero',
      'Ideal para rallar o cortar en cubos',
      'Pieza fresca sellada al vacío 500g'
    ],
    badge: 'Fresco del Día',
    sku: 'LAC-QUE-007'
  },
  {
    id: 'prod-08',
    name: 'Atún en Aceite Vegetal en Lata 140g',
    slug: 'atun-aceite-vegetal-140g',
    category: 'Enlatados & Conservas',
    priceUSD: 1.60,
    stock: 60,
    image: '/src/assets/images/atun_lata_1792624778484.jpg',
    description: 'Lomitos de atún seleccionados en aceite vegetal. Fuente natural de Omega 3 y proteínas, con abrefácil de seguridad.',
    features: [
      'Lomitos de Atún de Primera',
      'Rico en Omega-3 y Proteína',
      'Tapa abrefácil sin necesidad de abrelatas',
      'Peso escurrido 100g / Neto 140g'
    ],
    badge: 'Rápido & Sano',
    sku: 'ENL-ATU-008'
  },
  {
    id: 'prod-09',
    name: 'Mayonesa Cremosa Frasco 400g',
    slug: 'mayonesa-cremosa-frasco-400g',
    category: 'Salsas & Aderezos',
    priceUSD: 2.20,
    stock: 35,
    image: '/src/assets/images/mayonesa_frasco_1792624778564.jpg',
    description: 'Mayonesa extra cremosa elaborada con huevos seleccionados y toque de limón. El acompañante infaltable de sándwiches y ensaladas.',
    features: [
      'Consistencia suave y untable',
      'Con toque de zumo de limón natural',
      'Frasco de vidrio reciclable hermético',
      'Contenido neto: 400 gramos'
    ],
    badge: 'Clásico',
    sku: 'SAL-MAY-009'
  }
];

export const DEFAULT_CATEGORIES: import('../types').CategoryConfig[] = [
  {
    id: 'Víveres & Despensa',
    name: 'Víveres & Despensa',
    imageUrl: '/src/assets/images/harina_pan_1792624719412.jpg',
    description: 'Víveres esenciales para la cocina diaria',
    badgeText: 'Harina, Arroz, Pasta, Aceite',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'Lácteos & Refrigerados',
    name: 'Lácteos & Quesos',
    imageUrl: '/src/assets/images/queso_fresco_1792624762755.jpg',
    description: 'Leche, quesos venezolanos y frescos',
    badgeText: 'Leche en Polvo, Queso Llanero',
    color: 'from-sky-500 to-blue-600'
  },
  {
    id: 'Café & Desayuno',
    name: 'Café & Desayuno',
    imageUrl: '/src/assets/images/cafe_molido_1792624733974.jpg',
    description: 'Aroma tostado y calidad garantizada',
    badgeText: 'Café Molido Gourmet',
    color: 'from-amber-800 to-stone-900'
  },
  {
    id: 'Enlatados & Conservas',
    name: 'Enlatados & Pescados',
    imageUrl: '/src/assets/images/atun_lata_1792624778484.jpg',
    description: 'Proteínas listas y conservas seleccionadas',
    badgeText: 'Atún en Aceite',
    color: 'from-cyan-600 to-blue-700'
  },
  {
    id: 'Salsas & Aderezos',
    name: 'Salsas & Condimentos',
    imageUrl: '/src/assets/images/mayonesa_frasco_1792624778564.jpg',
    description: 'El mejor sazón y aderezos cremosos',
    badgeText: 'Mayonesa Cremosa',
    color: 'from-rose-500 to-red-600'
  }
];

export const INITIAL_CONFIG: StoreConfig = {
  storeName: 'BODEGA PETTER',
  logoUrl: '',
  bannerImageUrl: '',
  whatsappNumber: '584140978185',
  isOpen247: true,
  announcement: '🛒 ¡Supermercado & Víveres 24/7! Despachos inmediatos a domicilio, precios en USD y tasa oficial BCV',
  baseExchangeRate: 876.80,
  autoSyncBCV: true,
  bcvRate: 876.80,
  bcvLastSynced: new Date().toISOString(),
  bcvRateDate: 'BCV Oficial',
  secondaryCurrencyCode: 'VES',
  secondaryCurrencySymbol: 'Bs.',
  secondaryCurrencyName: 'Bolívares Digitales',
  lastRateUpdate: new Date().toISOString(),
  autoAudioPush: true,
  city: 'Caracas & Envíos Inmediatos',
  categories: DEFAULT_CATEGORIES
};
