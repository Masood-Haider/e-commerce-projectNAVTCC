// ==========================================================================
// CLOUD FIRESTORE HELPERS & DATA ACCESS LAYER
// Real-time integration with Cloud Firestore collections: 'products', 'orders', 'users'
// Uses async/await, destructuring, optional chaining, and spread operators
// ==========================================================================

import { db } from './firebase.js';
import { PRODUCTS, getProductById as getStaticProductById, getRelatedProducts as getStaticRelatedProducts } from './products-data.js';
import { formatProductImage } from './utils.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let isSeeding = false;

/**
 * Automatically seeds or manually syncs default catalog items into Firestore 'products' collection
 */
export async function seedInitialProductsIfEmpty(force = false) {
  if (isSeeding) return;
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty || force) {
      isSeeding = true;
      console.log('[Firestore] Uploading catalog products to Cloud Firestore...');
      
      const seedPromises = PRODUCTS.map(async (product) => {
        const { id, ...productPayload } = product;
        const docRef = doc(db, 'products', id);
        
        // Clean filename for image
        let cleanImage = productPayload.image || 'product_tee.png';
        cleanImage = cleanImage.replace('../assets/', '').replace('assets/', '');

        await setDoc(docRef, {
          ...productPayload,
          image: cleanImage,
          stock: productPayload.stock ?? 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(seedPromises);
      console.log('[Firestore] Catalog synchronization complete: 8 products active in Firestore.');
      return PRODUCTS.length;
    }
  } catch (err) {
    console.error('[Firestore] Seeding error:', err);
    throw err;
  } finally {
    isSeeding = false;
  }
}

/**
 * Direct sync button trigger to populate Firestore catalog with all 8 items
 */
export async function syncDefaultCatalogToFirestore() {
  return await seedInitialProductsIfEmpty(true);
}

// --- Product Queries ---

/**
 * Fetch all products or filtered products directly from Cloud Firestore
 */
export async function getProducts({
  query: search = '',
  category = '',
  sort = 'featured',
  inStockOnly = false,
  featuredOnly = false,
  recentOnly = false,
  maxAgeDays = 60
} = {}) {
  let products = [];

  try {
    const productsRef = collection(db, 'products');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2000));
    const snapshot = await Promise.race([getDocs(productsRef), timeoutPromise]);

    if (snapshot && !snapshot.empty) {
      products = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } else {
      products = [...PRODUCTS];
    }
  } catch (err) {
    console.warn('[Firestore] Fetching from local product dataset fallback:', err);
    products = [...PRODUCTS];
  }

  // 1. Search Query Filter using destructuring & optional chaining
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    products = products.filter(p => {
      const title = p?.title?.toLowerCase() || '';
      const desc = p?.description?.toLowerCase() || '';
      const cat = p?.category?.toLowerCase() || '';
      return title.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }

  // 2. Category Filter
  if (category && category !== 'all') {
    const targetCat = category.toLowerCase().trim();
    products = products.filter(p => {
      const pCat = (p?.category || '').toLowerCase().trim();
      if (pCat === targetCat) return true;
      if (targetCat === 'carry' && (pCat.includes('carry') || pCat.includes('bag'))) return true;
      if (targetCat === 'accessories' && (pCat.includes('access') || pCat.includes('watch'))) return true;
      if (targetCat === 'apparel' && (pCat.includes('apparel') || pCat.includes('tee') || pCat.includes('clothing'))) return true;
      if (targetCat === 'footwear' && (pCat.includes('footwear') || pCat.includes('shoe') || pCat.includes('sneaker'))) return true;
      return false;
    });
  }

  // 3. Featured Only Filter
  if (featuredOnly) {
    products = products.filter(p => Boolean(p?.featured));
  }

  // 4. Recent / New Arrivals Filter (Added within 2 months / maxAgeDays)
  if (recentOnly) {
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    products = products.filter(p => {
      if (p?.badge === 'New') return true;
      if (!p?.createdAt) return true;
      const createdTime = new Date(p.createdAt).getTime();
      return !isNaN(createdTime) && createdTime >= cutoffTime;
    });
  }

  // 5. In Stock Filter
  if (inStockOnly) {
    products = products.filter(p => (p?.stock ?? 0) > 0);
  }

  // 6. Sorting
  switch (sort) {
    case 'price-asc':
      products.sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));
      break;
    case 'price-desc':
      products.sort((a, b) => (b?.price ?? 0) - (a?.price ?? 0));
      break;
    case 'name-asc':
      products.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
      break;
    case 'name-desc':
      products.sort((a, b) => (b?.title || '').localeCompare(a?.title || ''));
      break;
    case 'rating':
      products.sort((a, b) => (b?.rating ?? 0) - (a?.rating ?? 0));
      break;
    case 'newest':
      products.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
      break;
    case 'featured':
    default:
      products.sort((a, b) => (b?.featured ? 1 : 0) - (a?.featured ? 1 : 0));
      break;
  }

  return products;
}

/**
 * Fetch a single product document from Cloud Firestore by its document ID
 */
export async function getProductById(productId) {
  if (!productId) return null;

  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
  } catch (err) {
    console.warn('[Firestore] getProductById Firestore lookup error:', err);
  }

  // Fallback to static dataset if Firestore lookup not found or offline
  return getStaticProductById(productId);
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts() {
  return getProducts({ featuredOnly: true });
}

/**
 * Get related products within same category, excluding the active product
 */
export async function getRelatedProducts(activeId, category, limitCount = 4) {
  try {
    const products = await getProducts({ category });
    const filtered = products.filter(p => p.id !== activeId);
    if (filtered && filtered.length > 0) {
      return filtered.slice(0, limitCount);
    }
  } catch (err) {
    console.warn('[Firestore] getRelatedProducts error:', err);
  }
  return getStaticRelatedProducts(activeId, category, limitCount);
}

/**
 * Create a new product document in Cloud Firestore (Admin)
 */
export async function createProduct(productData) {
  const {
    title,
    price,
    category,
    image,
    description,
    details = [],
    stock = 10,
    badge = null,
    featured = false,
    sizes = ['Standard'],
    colors = ['Default'],
    rating = 5.0,
    reviewsCount = 0
  } = productData;

  const newDoc = {
    title: title?.trim() || 'Untitled Product',
    price: parseFloat(price) || 0,
    category: category?.trim() || 'general',
    image: formatProductImage(image),
    description: description?.trim() || '',
    details: Array.isArray(details) ? details : (details ? details.split('\n').map(d => d.trim()).filter(Boolean) : []),
    stock: parseInt(stock, 10) || 0,
    badge: badge ? badge.trim() : null,
    featured: Boolean(featured),
    sizes: Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : ['Standard']),
    colors: Array.isArray(colors) ? colors : (colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : ['Default']),
    rating: parseFloat(rating) || 5.0,
    reviewsCount: parseInt(reviewsCount, 10) || 0,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'products'), newDoc);
  return { id: docRef.id, ...newDoc };
}

/**
 * Update an existing product document in Cloud Firestore (Admin)
 */
export async function updateProduct(productId, updates) {
  if (!productId) throw new Error('Product ID is required');

  const cleanUpdates = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (cleanUpdates.image !== undefined) cleanUpdates.image = formatProductImage(cleanUpdates.image);
  if (cleanUpdates.price !== undefined) cleanUpdates.price = parseFloat(cleanUpdates.price) || 0;
  if (cleanUpdates.stock !== undefined) cleanUpdates.stock = parseInt(cleanUpdates.stock, 10) || 0;
  if (cleanUpdates.details && typeof cleanUpdates.details === 'string') {
    cleanUpdates.details = cleanUpdates.details.split('\n').map(d => d.trim()).filter(Boolean);
  }
  if (cleanUpdates.sizes && typeof cleanUpdates.sizes === 'string') {
    cleanUpdates.sizes = cleanUpdates.sizes.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (cleanUpdates.colors && typeof cleanUpdates.colors === 'string') {
    cleanUpdates.colors = cleanUpdates.colors.split(',').map(c => c.trim()).filter(Boolean);
  }

  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, cleanUpdates);
  return { id: productId, ...cleanUpdates };
}

/**
 * Delete a product document from Cloud Firestore (Admin)
 */
export async function deleteProduct(productId) {
  if (!productId) throw new Error('Product ID is required');
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
  return true;
}

// --- Order Operations ---

/**
 * Place a new order in Cloud Firestore 'orders' collection
 */
export async function createOrder(orderPayload) {
  const {
    userId = null,
    items = [],
    pricing = {},
    customer = {},
    shippingAddress = {}
  } = orderPayload;

  const total = pricing?.grandTotal || orderPayload?.total || 0;

  // Clean structured Firestore order document
  const orderDocument = {
    userId,
    items: items.map(item => ({
      id: item?.id || '',
      name: item?.name || item?.title || '',
      price: parseFloat(item?.price) || 0,
      quantity: parseInt(item?.quantity, 10) || 1,
      image: item?.image || '',
      selectedSize: item?.selectedSize || null
    })),
    total,
    pricing: {
      subtotal: pricing?.subtotal || 0,
      shipping: pricing?.shipping || 0,
      tax: pricing?.tax || 0,
      grandTotal: total
    },
    customer: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || ''
    },
    shippingAddress: {
      street: shippingAddress?.street || '',
      suite: shippingAddress?.suite || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      zip: shippingAddress?.zip || '',
      country: shippingAddress?.country || 'United States'
    },
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, orderDocument);
    console.log('[Firestore] Successfully created order document in Firestore:', docRef.id);
    return {
      id: docRef.id,
      ...orderDocument
    };
  } catch (err) {
    console.error('[Firestore] Failed to write order document in Firestore:', err);
    throw new Error(`Failed to place order: ${err?.message || 'Database error'}`);
  }
}

/**
 * Fetch all orders from Cloud Firestore (Admin or Customer)
 */
export async function getOrders(userId = null) {
  try {
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('createdAt', 'desc'));

    if (userId) {
      q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (err) {
    console.warn('[Firestore] Error querying orders from Firestore:', err);
    return [];
  }
}

/**
 * Update an existing order status in Cloud Firestore
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to update order status in Firestore:', err);
    throw err;
  }
}

/**
 * Fetch all user documents from Cloud Firestore
 */
export async function getUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('[Firestore] getUsers fallback:', err);
  }
  return [];
}

/**
 * Fetch and calculate dashboard summary metrics & live chart datasets from Cloud Firestore
 */
export async function getDashboardMetrics() {
  try {
    const [products, orders, users] = await Promise.all([
      getProducts(),
      getOrders(),
      getUsers()
    ]);

    // Calculate total sales using reduce()
    const totalSales = orders.reduce((sum, order) => {
      const amount = parseFloat(order?.total ?? order?.pricing?.grandTotal ?? 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate pending orders count
    const pendingOrdersCount = orders.filter(o => o?.status === 'Pending' || o?.status === 'Processing').length;

    // Identify low stock items
    const lowStockProducts = products.filter(p => (p?.stock ?? 0) <= 10);

    // 1. Build Real 7-Day Revenue Dataset from live Firestore orders
    const dailyRevenueMap = {};
    const dayKeys = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyRevenueMap[key] = {
        label: weekday,
        fullDate,
        total: 0,
        ordersCount: 0
      };
      dayKeys.push(key);
    }

    // Map each order to its corresponding day bucket
    orders.forEach(order => {
      if (!order?.createdAt) return;
      const orderDateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const amount = parseFloat(order?.total ?? order?.pricing?.grandTotal ?? 0) || 0;
      
      if (dailyRevenueMap[orderDateKey]) {
        dailyRevenueMap[orderDateKey].total += amount;
        dailyRevenueMap[orderDateKey].ordersCount += 1;
      }
    });

    const revenueChartData = {
      labels: dayKeys.map(k => dailyRevenueMap[k].label),
      fullDates: dayKeys.map(k => dailyRevenueMap[k].fullDate),
      values: dayKeys.map(k => Math.round(dailyRevenueMap[k].total * 100) / 100),
      ordersCounts: dayKeys.map(k => dailyRevenueMap[k].ordersCount),
      totalSales
    };

    // 2. Build Real Category Distribution Dataset from live Firestore products
    const categoryMap = {};
    products.forEach(p => {
      let cat = (p?.category || 'General').trim();
      cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = categoryLabels.map(cat => categoryMap[cat]);

    const categoryChartData = {
      labels: categoryLabels.length > 0 ? categoryLabels : ['Apparel', 'Footwear', 'Accessories', 'Carry'],
      values: categoryValues.length > 0 ? categoryValues : [1, 1, 1, 1],
      totalItems: products.length
    };

    return {
      totalSales,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: users.length > 0 ? users.length : Math.max(new Set(orders.map(o => o?.customer?.email).filter(Boolean)).size, 1),
      pendingOrdersCount,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 4),
      revenueChartData,
      categoryChartData,
      products,
      orders
    };
  } catch (err) {
    console.error('[Firestore] Error calculating dashboard metrics:', err);
    return {
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      pendingOrdersCount: 0,
      recentOrders: [],
      lowStockProducts: [],
      revenueChartData: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], fullDates: [], values: [0,0,0,0,0,0,0], ordersCounts: [0,0,0,0,0,0,0], totalSales: 0 },
      categoryChartData: { labels: ['Apparel', 'Footwear', 'Accessories', 'Carry'], values: [0,0,0,0], totalItems: 0 },
      products: [],
      orders: []
    };
  }
}

/**
 * Subscribe to live real-time updates for products and orders in Cloud Firestore
 */
export function subscribeToDashboardRealtime(callback) {
  try {
    const productsRef = collection(db, 'products');
    const ordersRef = collection(db, 'orders');

    let debounceTimer = null;
    const notifyCallback = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const metrics = await getDashboardMetrics();
          callback(metrics);
        } catch (err) {
          console.warn('[Firestore] Live sync callback error:', err);
        }
      }, 150);
    };

    const unsubProducts = onSnapshot(productsRef, () => {
      notifyCallback();
    }, (err) => console.warn('[Firestore] Products live observer error:', err));

    const unsubOrders = onSnapshot(ordersRef, () => {
      notifyCallback();
    }, (err) => console.warn('[Firestore] Orders live observer error:', err));

    return () => {
      unsubProducts();
      unsubOrders();
    };
  } catch (err) {
    console.warn('[Firestore] Could not attach live observer:', err);
    return () => {};
  }
}

/**
 * Subscribe an email address to the newsletter in Cloud Firestore ('newsletter_subscribers' collection)
 */
export async function subscribeToNewsletter(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  const cleanEmail = email.trim().toLowerCase();
  // Safe document ID from sanitized email
  const docId = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    const subscriberRef = doc(db, 'newsletter_subscribers', docId);
    await setDoc(subscriberRef, {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      status: 'active',
      source: 'storefront_newsletter'
    }, { merge: true });

    return { id: docId, email: cleanEmail, status: 'active' };
  } catch (err) {
    console.error('[Firestore] Failed to save newsletter subscriber:', err);
    throw new Error(err.message || 'Unable to subscribe at this time.');
  }
}

/**
 * Fetch all newsletter subscriber documents from Cloud Firestore
 */
export async function getNewsletterSubscribers() {
  try {
    const subscribersRef = collection(db, 'newsletter_subscribers');
    const snapshot = await getDocs(subscribersRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest subscribers first
      return list.sort((a, b) => new Date(b.subscribedAt || 0) - new Date(a.subscribedAt || 0));
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching newsletter subscribers:', err);
  }
  return [];
}

/**
 * Delete or unsubscribe a user from newsletter in Cloud Firestore
 */
export async function deleteNewsletterSubscriber(id) {
  try {
    const subRef = doc(db, 'newsletter_subscribers', id);
    await deleteDoc(subRef);
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to delete newsletter subscriber:', err);
    throw err;
  }
}

/**
 * Calculate real-time item count and available stock per category from Cloud Firestore
 */
export async function getCategoryStockMetrics() {
  try {
    const products = await getProducts();
    const metrics = {
      apparel: { count: 0, stock: 0 },
      footwear: { count: 0, stock: 0 },
      accessories: { count: 0, stock: 0 },
      carry: { count: 0, stock: 0 }
    };

    products.forEach(p => {
      let cat = (p?.category || 'general').toLowerCase().trim();
      if (!metrics[cat]) {
        metrics[cat] = { count: 0, stock: 0 };
      }
      metrics[cat].count += 1;
      metrics[cat].stock += (parseInt(p?.stock, 10) || 0);
    });

    return metrics;
  } catch (err) {
    console.warn('[Firestore] Error calculating category stock metrics:', err);
    return {};
  }
}

// Initial Auto-Seed Trigger
seedInitialProductsIfEmpty();
