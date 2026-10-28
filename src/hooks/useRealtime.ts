import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStatus, Product, StoreConfig, WebSocketMessage, OwnerSession } from '../types';
import { INITIAL_CONFIG, INITIAL_PRODUCTS } from '../data/initialProducts';
import { soundService } from '../utils/sound';
import { formatUSD, formatSecondary } from '../utils/currency';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export function useRealtime() {
  const [config, setConfig] = useState<StoreConfig>(INITIAL_CONFIG);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [latestPushOrder, setLatestPushOrder] = useState<Order | null>(null);

  // Owner authentication session state
  const [ownerSession, setOwnerSession] = useState<OwnerSession>(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('owner_token');
      const savedEmail = localStorage.getItem('owner_email');
      const savedUser = localStorage.getItem('owner_username');
      if (savedToken) {
        return {
          authenticated: true,
          email: savedEmail || 'pedroalmeida1420@gmail.com',
          username: savedUser || 'PETTER1420',
          token: savedToken
        };
      }
    }
    return { authenticated: false, email: null, username: null, token: null };
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // 1. Real-Time Cloud Firestore Sync (Ensures owner changes persist across ANY device)
  useEffect(() => {
    let isMounted = true;

    // Listen to Store Configuration in Google Cloud Firestore
    const unsubConfig = onSnapshot(
      doc(db, 'storeConfig', 'main'),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          const cloudConfig = snapshot.data() as StoreConfig;
          setConfig((prev) => ({ ...prev, ...cloudConfig }));
        } else {
          // Initialize default store configuration in Firestore
          setDoc(doc(db, 'storeConfig', 'main'), INITIAL_CONFIG).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, 'storeConfig/main');
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'storeConfig/main');
      }
    );

    // Listen to Catalog Products in Google Cloud Firestore
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const cloudProducts = snapshot.docs.map((d) => d.data() as Product);
          setProducts(cloudProducts);
        } else {
          // Seed initial products to Firestore if collection is empty
          const batch = writeBatch(db);
          INITIAL_PRODUCTS.forEach((prod) => {
            const ref = doc(db, 'products', prod.id);
            batch.set(ref, prod);
          });
          batch.commit().catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, 'products');
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    // Listen to Customer Orders in Google Cloud Firestore
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const cloudOrders = snapshot.docs.map((d) => d.data() as Order);
          cloudOrders.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(cloudOrders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      isMounted = false;
      unsubConfig();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // 2. Connect to WebSocket server for instant audio alerts & push chimes
  const connectWs = useCallback(() => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);

          if (msg.type === 'init') {
            if (msg.payload?.config) setConfig((prev) => ({ ...prev, ...msg.payload.config }));
          } else if (msg.type === 'config:updated') {
            setConfig((prev) => ({ ...prev, ...msg.payload }));
          } else if (msg.type === 'order:new') {
            const newOrder: Order = msg.payload;
            setLatestPushOrder(newOrder);

            // Instant audio chime
            soundService.playOrderChime();

            // Native browser push notification
            const secondaryTotal = formatSecondary(
              newOrder.totalUSD,
              newOrder.exchangeRateUsed,
              newOrder.secondaryCurrencySymbol,
              newOrder.secondaryCurrencyCode
            );
            soundService.triggerNativePush(
              `🔔 ¡Nuevo Pedido #${newOrder.orderNumber}!`,
              `${newOrder.customerName} · Total: ${formatUSD(newOrder.totalUSD)} (${secondaryTotal})`
            );
          }
        } catch {
          // malformed message
        }
      };

      socket.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch {
      reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
    }
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  // Keep-alive ping
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Validate session on mount
  useEffect(() => {
    if (ownerSession.token) {
      fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${ownerSession.token}` }
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.authenticated) {
            localStorage.removeItem('owner_token');
            localStorage.removeItem('owner_email');
            setOwnerSession({ authenticated: false, email: null, token: null });
          }
        })
        .catch(() => {});
    }
  }, [ownerSession.token]);

  // Auth Operations: Direct Login with Username and Password
  const loginOwner = useCallback(async (username: string, password: string) => {
    const cleanUser = username.trim().toUpperCase();
    const cleanPass = password.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Usuario o clave incorrectos.');
      }

      const newSession: OwnerSession = {
        authenticated: true,
        username: data.username || 'PETTER1420',
        email: data.email || 'pedroalmeida1420@gmail.com',
        token: data.token
      };

      // Persist in Google Cloud Firestore so session is registered
      try {
        await setDoc(doc(db, 'sessions', data.token), {
          username: data.username || 'PETTER1420',
          email: data.email || 'pedroalmeida1420@gmail.com',
          createdAt: Date.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `sessions/${data.token}`);
      }

      localStorage.setItem('owner_token', data.token);
      localStorage.setItem('owner_username', data.username || 'PETTER1420');
      localStorage.setItem('owner_email', data.email || 'pedroalmeida1420@gmail.com');
      setOwnerSession(newSession);
      return newSession;
    } catch (networkErr: any) {
      // Offline fallback: if network is down, allow login with official credentials
      if (cleanUser === 'PETTER1420' && cleanPass === 'bodega1420') {
        const localToken = 'owner_device_' + Date.now();
        const fallbackSession: OwnerSession = {
          authenticated: true,
          username: 'PETTER1420',
          email: 'pedroalmeida1420@gmail.com',
          token: localToken
        };
        localStorage.setItem('owner_token', localToken);
        localStorage.setItem('owner_username', 'PETTER1420');
        localStorage.setItem('owner_email', 'pedroalmeida1420@gmail.com');
        setOwnerSession(fallbackSession);
        return fallbackSession;
      }
      throw networkErr;
    }
  }, []);

  const logoutOwner = useCallback(async () => {
    if (ownerSession.token) {
      try {
        await deleteDoc(doc(db, 'sessions', ownerSession.token));
      } catch {
        // ignore
      }
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerSession.token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_email');
    localStorage.removeItem('owner_username');
    setOwnerSession({ authenticated: false, email: null, username: null, token: null });
  }, [ownerSession.token]);

  // Product Operations (Persisted in Firestore across ALL devices)
  const addProduct = useCallback(async (productData: Partial<Product>) => {
    const id = productData.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      id,
      name: productData.name?.trim() || 'Nuevo Producto',
      slug: (productData.name || 'nuevo-producto').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: productData.category?.trim() || 'General',
      priceUSD: Number(productData.priceUSD) || 0,
      stock: Number(productData.stock) >= 0 ? Number(productData.stock) : 10,
      image: productData.image?.trim() || '/src/assets/images/product_wireless_headphones_1791923231659.jpg',
      description: productData.description?.trim() || 'Producto disponible en catálogo 24/7.',
      features: Array.isArray(productData.features) ? productData.features : [productData.description || 'Garantía oficial'],
      badge: productData.badge?.trim() || 'Nuevo',
      sku: productData.sku?.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`
    };

    // 1. Direct Cloud Firestore Persistence
    try {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProduct.id}`);
    }

    // 2. Notify backend for server/WS sync
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(() => {});

    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    // 1. Direct Cloud Firestore Persistence
    try {
      await setDoc(doc(db, 'products', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }

    // 2. Notify backend
    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    return updates as Product;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    // 1. Direct Cloud Firestore Deletion
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }

    // 2. Notify backend
    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Store Configuration & Rate Operations (Persisted in Firestore across ALL devices)
  const updateRate = useCallback(async (newRate: number) => {
    const lastRateUpdate = new Date().toISOString();
    try {
      await setDoc(doc(db, 'storeConfig', 'main'), { baseExchangeRate: newRate, lastRateUpdate }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'storeConfig/main');
    }

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseExchangeRate: newRate })
    }).catch(() => {});

    setConfig((prev) => ({
      ...prev,
      baseExchangeRate: newRate,
      lastRateUpdate
    }));
  }, []);

  const updateConfig = useCallback(async (updates: Partial<StoreConfig>) => {
    try {
      await setDoc(doc(db, 'storeConfig', 'main'), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'storeConfig/main');
    }

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});

    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const submitOrder = useCallback(
    async (orderData: Partial<Order>): Promise<Order> => {
      const orderNumber = `VD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: orderData.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderNumber: orderData.orderNumber || orderNumber,
        createdAt: orderData.createdAt || new Date().toISOString(),
        customerName: orderData.customerName || 'Cliente',
        customerPhone: orderData.customerPhone || '',
        customerAddress: orderData.customerAddress || '',
        deliveryMethod: orderData.deliveryMethod || 'delivery_express',
        paymentMethod: orderData.paymentMethod || 'pago_movil',
        notes: orderData.notes || '',
        items: orderData.items || [],
        subtotalUSD: Number(orderData.subtotalUSD) || 0,
        subtotalSecondary: Number(orderData.subtotalSecondary) || 0,
        totalUSD: Number(orderData.totalUSD) || 0,
        totalSecondary: Number(orderData.totalSecondary) || 0,
        exchangeRateUsed: Number(orderData.exchangeRateUsed) || config.baseExchangeRate,
        secondaryCurrencySymbol: config.secondaryCurrencySymbol,
        secondaryCurrencyCode: config.secondaryCurrencyCode,
        status: 'pendiente',
        whatsappSent: orderData.whatsappSent ?? true
      };

      // 1. Direct Cloud Firestore Persistence
      try {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      } catch (err) {
        console.warn('[Firestore] Error guardando pedido en Firestore:', err);
      }

      // 2. Notify backend for multi-device sync
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
      } catch (netErr) {
        console.warn('[Server] Error notificando orden a API backend:', netErr);
      }

      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      return newOrder;
    },
    [config.baseExchangeRate, config.secondaryCurrencySymbol, config.secondaryCurrencyCode]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        await setDoc(doc(db, 'orders', orderId), { status }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }

      fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => {});

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    },
    []
  );

  const syncBCVRate = useCallback(async () => {
    const res = await fetch('/api/bcv/sync', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo sincronizar con la tasa oficial BCV');
    }
    if (data.config) {
      setConfig((prev) => ({ ...prev, ...data.config }));
      try {
        await setDoc(doc(db, 'storeConfig', 'main'), data.config, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'storeConfig/main');
      }
    }
    return data;
  }, []);

  const clearLatestPushOrder = useCallback(() => {
    setLatestPushOrder(null);
  }, []);

  return {
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
  };
}
