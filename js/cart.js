// ==========================================================================
// SHOPPING CART MODULE
// Helpers for cart state, localStorage persistence, quantity mutations,
// and mathematical calculations using Array.prototype.reduce()
// ==========================================================================

const CART_STORAGE_KEY = 'aura_store_cart_v1';

/**
 * Generate a unique cart item identifier (taking variants/sizes into account)
 */
export function getCartItemKey(item) {
  return `${item.id}_${item.selectedSize || 'std'}`;
}

/**
 * Retrieve current cart items from local storage
 */
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse cart storage:', err);
    return [];
  }
}

/**
 * Save cart items to local storage & dispatch global reactive event
 */
export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
}

/**
 * Add a product to the cart (with optional size/variant)
 */
export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const itemKey = getCartItemKey(product);
  const existingIndex = cart.findIndex(item => getCartItemKey(item) === itemKey);

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name || product.title,
      price: parseFloat(product.price) || 0,
      category: product.category || 'General',
      image: product.image || '../assets/product_tee.png',
      selectedSize: product.selectedSize || null,
      quantity: Math.max(1, quantity)
    });
  }

  saveCart(cart);
  return cart;
}

/**
 * Remove an item from the cart by its composite key
 */
export function removeFromCart(itemKey) {
  let cart = getCart();
  cart = cart.filter(item => getCartItemKey(item) !== itemKey && item.id !== itemKey);
  saveCart(cart);
  return cart;
}

/**
 * Set an explicit quantity for a cart item
 */
export function updateCartQuantity(itemKey, quantity) {
  const cart = getCart();
  const item = cart.find(i => getCartItemKey(i) === itemKey || i.id === itemKey);
  
  if (item) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return removeFromCart(itemKey);
    }
    item.quantity = qty;
    saveCart(cart);
  }
  return cart;
}

/**
 * Increase quantity of an item by 1
 */
export function increaseQuantity(itemKey) {
  const cart = getCart();
  const item = cart.find(i => getCartItemKey(i) === itemKey || i.id === itemKey);
  if (item) {
    item.quantity = (item.quantity || 1) + 1;
    saveCart(cart);
  }
  return cart;
}

/**
 * Decrease quantity of an item by 1 (removes if reaches 0)
 */
export function decreaseQuantity(itemKey) {
  const cart = getCart();
  const item = cart.find(i => getCartItemKey(i) === itemKey || i.id === itemKey);
  if (item) {
    if (item.quantity > 1) {
      item.quantity -= 1;
      saveCart(cart);
    } else {
      return removeFromCart(itemKey);
    }
  }
  return cart;
}

/**
 * Clear all items from cart
 */
export function clearCart() {
  saveCart([]);
}

/**
 * Calculate total quantity of items in cart using reduce()
 */
export function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((totalCount, item) => totalCount + (item.quantity || 0), 0);
}

/**
 * Calculate cart subtotal using Array.prototype.reduce()
 */
export function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((runningSum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity, 10) || 1;
    return runningSum + (price * qty);
  }, 0);
}

/**
 * Calculate estimated shipping based on subtotal (Free over $100)
 */
export function getCartShipping(subtotal = null) {
  const amount = subtotal !== null ? subtotal : getCartSubtotal();
  if (amount === 0) return 0;
  return amount >= 100 ? 0 : 12.00;
}

/**
 * Calculate estimated sales tax (8%) using reduce() logic
 */
export function getCartTax(subtotal = null, rate = 0.08) {
  const amount = subtotal !== null ? subtotal : getCartSubtotal();
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Calculate grand total including discount, tax, and shipping
 */
export function getCartGrandTotal(discount = 0) {
  const subtotal = getCartSubtotal();
  if (subtotal === 0) return 0;

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = getCartShipping(discountedSubtotal);
  const tax = getCartTax(discountedSubtotal);

  return discountedSubtotal + shipping + tax;
}
