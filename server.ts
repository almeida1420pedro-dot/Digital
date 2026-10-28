import express from 'express';
import http from 'http';
import https from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { INITIAL_CONFIG, INITIAL_PRODUCTS } from './src/data/initialProducts.ts';
import type { Order, Product, StoreConfig, WebSocketMessage } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// High body limit to allow product images uploaded from phones and computers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Persistent storage setup
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredData {
  config: StoreConfig;
  products: Product[];
  orders: Order[];
  sessions?: Record<string, { email: string; createdAt: number }>;
}

let storeConfig: StoreConfig = { ...INITIAL_CONFIG };
let products: Product[] = [...INITIAL_PRODUCTS];
let orders: Order[] = [
  {
    id: 'ord-seed-01',
    orderNumber: 'VD-3921',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    customerName: 'Carlos Mendoza',
    customerPhone: '+58 414 555 1234',
    customerAddress: 'Av. Francisco de Miranda, Edif. Parque Cristal, Caracas',
    deliveryMethod: 'delivery_express',
    paymentMethod: 'pago_movil',
    notes: 'Entregar en recepción antes de las 5pm',
    items: [
      {
        productId: 'prod-01',
        name: 'Auriculares Inalámbricos Pro ANC',
        quantity: 1,
        priceUSD: 85.0,
        priceSecondary: 85.0 * 55.40
      }
    ],
    subtotalUSD: 85.0,
    subtotalSecondary: 85.0 * 55.40,
    totalUSD: 85.0,
    totalSecondary: 85.0 * 55.40,
    exchangeRateUsed: 55.40,
    secondaryCurrencySymbol: 'Bs.',
    secondaryCurrencyCode: 'VES',
    status: 'preparando',
    whatsappSent: true
  }
];

// Active owner sessions
const activeTokens = new Map<string, { email: string; username?: string; createdAt: number }>();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';

// Google Cloud Firestore persistent cloud database setup
let firestoreDb: any = null;
try {
  const fbConfigRaw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf-8');
  const fbConfig = JSON.parse(fbConfigRaw);
  const fbApp = initializeApp(fbConfig, 'server-app');
  firestoreDb = getFirestore(fbApp, fbConfig.firestoreDatabaseId);
  console.log('[Store24/7 Cloud] Conectado a Google Cloud Firestore:', fbConfig.firestoreDatabaseId);
} catch (e: any) {
  console.warn('[Store24/7 Cloud] Advertencia iniciando Firestore en servidor:', e?.message);
}

// Load from disk if present
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: StoredData = JSON.parse(raw);
    if (parsed.config) storeConfig = { ...INITIAL_CONFIG, ...parsed.config };
    if (Array.isArray(parsed.products)) products = parsed.products;
    if (Array.isArray(parsed.orders)) orders = parsed.orders;
    if (parsed.sessions && typeof parsed.sessions === 'object') {
      for (const [token, sess] of Object.entries(parsed.sessions)) {
        if (sess && sess.email) {
          activeTokens.set(token, sess);
        }
      }
    }
    console.log(`[Store24/7] Loaded ${products.length} products, ${orders.length} orders and ${activeTokens.size} sessions from local disk.`);
  } catch (err) {
    console.error('[Store24/7] Error reading local store:', err);
  }
}

// Synchronize with Google Cloud Firestore at boot to guarantee multi-device persistence
async function syncFromCloudFirestore() {
  if (!firestoreDb) return;
  try {
    // 1. Store Config from Cloud
    const configSnap = await getDoc(doc(firestoreDb, 'storeConfig', 'main'));
    if (configSnap.exists()) {
      storeConfig = { ...storeConfig, ...configSnap.data() };
      console.log('[Store24/7 Cloud] Configuración de tienda sincronizada desde Firestore:', storeConfig.storeName);
    } else {
      await setDoc(doc(firestoreDb, 'storeConfig', 'main'), storeConfig);
    }

    // 2. Products from Cloud
    const prodSnap = await getDocs(collection(firestoreDb, 'products'));
    if (!prodSnap.empty) {
      products = prodSnap.docs.map((d: any) => d.data() as Product);
      console.log(`[Store24/7 Cloud] ${products.length} productos sincronizados desde Google Cloud Firestore.`);
    } else {
      // Seed initial products to Firestore
      for (const p of products) {
        await setDoc(doc(firestoreDb, 'products', p.id), p);
      }
      console.log(`[Store24/7 Cloud] ${products.length} productos iniciales sembrados en Firestore.`);
    }

    // 3. Orders from Cloud
    const orderSnap = await getDocs(collection(firestoreDb, 'orders'));
    if (!orderSnap.empty) {
      orders = orderSnap.docs.map((d: any) => d.data() as Order);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log(`[Store24/7 Cloud] ${orders.length} pedidos sincronizados desde Firestore.`);
    }

    // 4. Multi-device Owner Sessions from Cloud
    const sessSnap = await getDocs(collection(firestoreDb, 'sessions'));
    if (!sessSnap.empty) {
      sessSnap.docs.forEach((d: any) => {
        const data = d.data() as { email: string; createdAt: number };
        activeTokens.set(d.id, data);
      });
      console.log(`[Store24/7 Cloud] ${activeTokens.size} sesiones de propietario activas sincronizadas.`);
    }

    saveData();
  } catch (err) {
    console.warn('[Store24/7 Cloud] Advertencia en sincronización inicial con Firestore:', err);
  }
}
syncFromCloudFirestore().catch(() => {});

function saveData() {
  try {
    const sessionsObj: Record<string, { email: string; createdAt: number }> = {};
    activeTokens.forEach((v, k) => {
      // Keep valid sessions up to 60 days
      if (Date.now() - v.createdAt < 60 * 24 * 60 * 60 * 1000) {
        sessionsObj[k] = v;
      }
    });
    const data: StoredData = {
      config: storeConfig,
      products,
      orders,
      sessions: sessionsObj
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store24/7] Failed to save data to disk:', err);
  }

  // Also sync configuration to Google Cloud Firestore
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'storeConfig', 'main'), storeConfig).catch(() => {});
  }
}

// WebSocket server setup
const wss = new WebSocketServer({ server });

function broadcast(message: WebSocketMessage) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  // Send initial state to newly connected client
  const initMessage: WebSocketMessage = {
    type: 'init',
    payload: {
      config: storeConfig,
      orders: orders.slice(0, 50),
      products
    }
  };
  ws.send(JSON.stringify(initMessage));

  ws.on('message', (data) => {
    try {
      const msg: WebSocketMessage = JSON.parse(data.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // Ignore malformed socket messages
    }
  });
});

// Authentication Routes for Store Owner
// Direct Login with Username and Password (Works on ANY device)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Debes ingresar el nombre de usuario y la clave.' });
  }

  const cleanUser = username.toString().trim().toUpperCase();
  const cleanPass = password.toString().trim();

  // Official credentials: PETTER1420 / bodega1420
  if (cleanUser === 'PETTER1420' && cleanPass === 'bodega1420') {
    const token = 'owner_' + crypto.randomUUID();
    const sessionData = {
      username: 'PETTER1420',
      email: 'pedroalmeida1420@gmail.com',
      createdAt: Date.now()
    };

    activeTokens.set(token, sessionData);
    saveData();

    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'sessions', token), sessionData).catch((err: any) => {
        console.warn('[Store24/7 Cloud] Error guardando sesión en Firestore:', err?.message);
      });
    }

    console.log('[Store24/7 Auth] Sesión autorizada como PETTER1420');

    return res.json({
      success: true,
      token,
      username: 'PETTER1420',
      email: 'pedroalmeida1420@gmail.com'
    });
  }

  return res.status(401).json({
    error: 'Usuario o clave incorrectos. Verifica tus datos de acceso.'
  });
});

app.get('/api/auth/session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  const token = authHeader.substring(7);
  let session = activeTokens.get(token);

  // If not found in memory, check Firestore (e.g., container restart or multiple instances)
  if (!session && firestoreDb) {
    try {
      const sessSnap = await getDoc(doc(firestoreDb, 'sessions', token));
      if (sessSnap.exists()) {
        session = sessSnap.data() as { email: string; username?: string; createdAt: number };
        activeTokens.set(token, session);
      }
    } catch {
      // ignore
    }
  }

  if (!session) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    email: session.email,
    username: (session as any).username || 'PETTER1420'
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
    saveData();
    if (firestoreDb) {
      deleteDoc(doc(firestoreDb, 'sessions', token)).catch(() => {});
    }
  }
  res.json({ success: true });
});

// Direct scraper for the official Banco Central de Venezuela website (https://www.bcv.org.ve/)
function fetchDirectFromBCVWebsite(): Promise<{ rate: number; date: string; source: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get('https://www.bcv.org.ve/', {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        // Parse rate from div id="dolar" inside strong tag
        const match = data.match(/id="dolar"[^]*?<strong[^>]*>([0-9.,]+)<\/strong>/i);
        const dateMatch = data.match(/Fecha Valor:[^]*?<span[^>]*class="date-display-single"[^>]*>([^<]+)<\/span>/i);
        if (!match || !match[1]) {
          return reject(new Error('No se encontró el contenedor de tasa en https://www.bcv.org.ve/'));
        }
        // Venezuelan number format: '877,90230000' or '877.90230000'
        const cleanRateStr = match[1].trim().replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanRateStr);
        if (isNaN(num) || num <= 0) {
          return reject(new Error(`Tasa inválida leída directamente del portal BCV: ${match[1]}`));
        }
        const dateStr = dateMatch && dateMatch[1] ? dateMatch[1].replace(/\s+/g, ' ').trim() : new Date().toLocaleDateString('es-VE');
        resolve({
          rate: Math.round(num * 100) / 100,
          date: dateStr,
          source: 'Banco Central de Venezuela (Página Oficial www.bcv.org.ve)'
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con https://www.bcv.org.ve/'));
    });
  });
}

// Banco Central de Venezuela (BCV) Live Rate Integration (Direct + Resilient Fallback)
async function syncWithBCV(): Promise<{ success: boolean; rate: number; error?: string; date?: string; source?: string }> {
  let rateValue: number | null = null;
  let rateDate = '';
  let rateSource = '';

  // 1. Direct connection to the official BCV webpage
  try {
    const directResult = await fetchDirectFromBCVWebsite();
    rateValue = directResult.rate;
    rateDate = directResult.date;
    rateSource = directResult.source;
    console.log(`[Store24/7 BCV] Conexión DIRECTA a https://www.bcv.org.ve/ exitosa: Bs. ${rateValue} (${rateDate})`);
  } catch (directErr: any) {
    console.warn(`[Store24/7 BCV] Advertencia en conexión directa a bcv.org.ve: ${directErr?.message}. Consultando API oficial de respaldo...`);
  }

  // 2. Secondary fallback if direct bcv.org.ve portal was unreachable
  if (!rateValue) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data: any = await response.json();
        const parsed = typeof data.promedio === 'number' ? data.promedio : parseFloat(data.promedio);
        if (parsed && !isNaN(parsed) && parsed > 0) {
          rateValue = Math.round(parsed * 100) / 100;
          rateDate = data.fechaActualizacion || new Date().toISOString();
          rateSource = 'API Oficial DolarAPI / BCV';
          console.log(`[Store24/7 BCV] Tasa obtenida de API de respaldo: Bs. ${rateValue}`);
        }
      }
    } catch (fbErr: any) {
      console.warn(`[Store24/7 BCV] Error en respaldo API:`, fbErr?.message);
    }
  }

  if (!rateValue) {
    return {
      success: false,
      rate: storeConfig.baseExchangeRate,
      error: 'No se pudo conectar a la página oficial de BCV ni a la fuente de respaldo.'
    };
  }

  storeConfig.baseExchangeRate = rateValue;
  storeConfig.bcvRate = rateValue;
  storeConfig.bcvLastSynced = new Date().toISOString();
  storeConfig.bcvRateDate = rateDate;
  storeConfig.lastRateUpdate = new Date().toISOString();

  saveData();

  broadcast({
    type: 'config:updated',
    payload: storeConfig
  });

  broadcast({
    type: 'rate:updated',
    payload: {
      rate: rateValue,
      lastUpdate: storeConfig.lastRateUpdate
    }
  });

  console.log(`[Store24/7 BCV] Tasa BCV aplicada en vivo: Bs. ${rateValue} por USD (${rateDate}) [${rateSource}]`);
  return { success: true, rate: rateValue, date: rateDate, source: rateSource };
}

// Auto-sync BCV rate periodically every 30 minutes
const BCV_SYNC_INTERVAL_MS = 30 * 60 * 1000;
setInterval(() => {
  if (storeConfig.autoSyncBCV !== false) {
    syncWithBCV().catch((err) => console.warn('[Store24/7 BCV] Periodic sync warning:', err));
  }
}, BCV_SYNC_INTERVAL_MS);

// Initial sync shortly after server boot
setTimeout(() => {
  if (storeConfig.autoSyncBCV !== false) {
    syncWithBCV().catch((err) => console.warn('[Store24/7 BCV] Startup sync warning:', err));
  }
}, 1500);

// REST API Endpoints
app.get('/api/config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(storeConfig);
});

app.get('/api/sync/all', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({
    config: storeConfig,
    products,
    orders: orders.slice(0, 50)
  });
});

app.post('/api/config', (req, res) => {
  const updates = req.body;
  storeConfig = {
    ...storeConfig,
    ...updates,
    lastRateUpdate: updates.baseExchangeRate ? new Date().toISOString() : storeConfig.lastRateUpdate
  };
  saveData();

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'storeConfig', 'main'), storeConfig, { merge: true }).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error guardando config en Firestore:', err?.message);
    });
  }

  broadcast({
    type: 'config:updated',
    payload: storeConfig
  });
  res.json(storeConfig);
});

// BCV API endpoints
app.post('/api/bcv/sync', async (_req, res) => {
  const result = await syncWithBCV();
  if (result.success) {
    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'storeConfig', 'main'), storeConfig, { merge: true }).catch(() => {});
    }
    res.json({
      success: true,
      rate: result.rate,
      date: result.date,
      source: result.source,
      config: storeConfig
    });
  } else {
    res.status(502).json({
      success: false,
      error: result.error,
      currentRate: storeConfig.baseExchangeRate,
      config: storeConfig
    });
  }
});

app.get('/api/bcv/rate', async (_req, res) => {
  res.json({
    currentRate: storeConfig.baseExchangeRate,
    bcvRate: storeConfig.bcvRate,
    bcvLastSynced: storeConfig.bcvLastSynced,
    bcvRateDate: storeConfig.bcvRateDate,
    autoSyncBCV: storeConfig.autoSyncBCV !== false
  });
});

// Product Management Endpoints (Stored & Persisted)
app.get('/api/products', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const body = req.body;
  if (!body.name || !body.priceUSD) {
    return res.status(400).json({ error: 'Nombre y precio en USD son requeridos.' });
  }

  const newProduct: Product = {
    id: body.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: body.name.trim(),
    slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: body.category?.trim() || 'General',
    priceUSD: Number(body.priceUSD) || 0,
    stock: Number(body.stock) >= 0 ? Number(body.stock) : 10,
    image: body.image?.trim() || '/src/assets/images/product_wireless_headphones_1791923231659.jpg',
    description: body.description?.trim() || 'Producto disponible en catálogo 24/7.',
    features: Array.isArray(body.features) ? body.features : [body.description || 'Garantía oficial'],
    badge: body.badge?.trim() || 'Nuevo',
    sku: body.sku?.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`
  };

  products.unshift(newProduct);
  saveData();

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'products', newProduct.id), newProduct).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error guardando producto en Firestore:', err?.message);
    });
  }

  broadcast({
    type: 'products:updated',
    payload: products
  });

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  products[index] = {
    ...products[index],
    ...updates,
    priceUSD: updates.priceUSD !== undefined ? Number(updates.priceUSD) : products[index].priceUSD,
    stock: updates.stock !== undefined ? Number(updates.stock) : products[index].stock
  };

  saveData();

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'products', id), products[index], { merge: true }).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error actualizando producto en Firestore:', err?.message);
    });
  }

  broadcast({
    type: 'products:updated',
    payload: products
  });

  res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const deleted = products.splice(index, 1)[0];
  saveData();

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'products', id)).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error eliminando producto de Firestore:', err?.message);
    });
  }

  broadcast({
    type: 'products:updated',
    payload: products
  });

  res.json({ success: true, deleted });
});

app.get('/api/orders', (_req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const body = req.body;
  const orderNumber = `VD-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: Order = {
    id: body.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderNumber,
    createdAt: body.createdAt || new Date().toISOString(),
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress || '',
    deliveryMethod: body.deliveryMethod || 'delivery_express',
    paymentMethod: body.paymentMethod || 'pago_movil',
    notes: body.notes || '',
    items: body.items || [],
    subtotalUSD: Number(body.subtotalUSD) || 0,
    subtotalSecondary: Number(body.subtotalSecondary) || 0,
    totalUSD: Number(body.totalUSD) || 0,
    totalSecondary: Number(body.totalSecondary) || 0,
    exchangeRateUsed: Number(body.exchangeRateUsed) || storeConfig.baseExchangeRate,
    secondaryCurrencySymbol: storeConfig.secondaryCurrencySymbol,
    secondaryCurrencyCode: storeConfig.secondaryCurrencyCode,
    status: 'pendiente',
    whatsappSent: body.whatsappSent ?? true
  };

  orders.unshift(newOrder);
  saveData();

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'orders', newOrder.id), newOrder).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error guardando orden en Firestore:', err?.message);
    });
  }

  // Broadcast INSTANT PUSH to all connected sellers/devices
  broadcast({
    type: 'order:new',
    payload: newOrder
  });

  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderIndex = orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIndex].status = status;
  saveData();

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'orders', id), { status }, { merge: true }).catch((err: any) => {
      console.warn('[Store24/7 Cloud] Error actualizando orden en Firestore:', err?.message);
    });
  }

  broadcast({
    type: 'order:updated',
    payload: { id, status }
  });

  res.json(orders[orderIndex]);
});

// Vite dev middleware or static serving
async function setupViteOrStatic() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Store24/7 Server] Running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
