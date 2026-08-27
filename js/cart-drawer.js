/**
 * Global Quick Cart Slide-Over Drawer
 * Provides an interactive slide-over panel when clicking the navbar cart button.
 */
import { getCartItems, updateCartQuantity, removeFromCart, getCartSubtotal, getCartItemCount } from './cart.js';
import { formatCurrency, formatProductImage } from './utils.js';

let drawerBackdrop = null;

export function initCartDrawer() {
  if (typeof window === 'undefined') return;

  // Build drawer DOM structure if missing
  if (!document.getElementById('quick-cart-backdrop')) {
    drawerBackdrop = document.createElement('div');
    drawerBackdrop.id = 'quick-cart-backdrop';
    drawerBackdrop.className = 'quick-cart-backdrop';
    drawerBackdrop.innerHTML = `
      <aside class="quick-cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        <div class="quick-cart-header">
          <div class="flex items-center gap-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 class="font-bold text-base" style="margin: 0;">Your Cart (<span id="qc-item-count">0</span>)</h3>
          </div>
          <button type="button" id="qc-close-btn" class="qc-close-btn" aria-label="Close Cart">&times;</button>
        </div>

        <div class="qc-free-shipping">
          <div class="flex items-center justify-between text-xs font-medium mb-1" id="qc-shipping-label">
            <span>Free Shipping Progress</span>
            <span id="qc-shipping-delta">$100.00 away</span>
          </div>
          <div class="shipping-progress-bar">
            <div class="shipping-progress-fill" id="qc-shipping-fill" style="width: 0%;"></div>
          </div>
        </div>

        <div id="qc-items-list" class="quick-cart-items-list">
          <!-- Rendered dynamically -->
        </div>

        <div class="quick-cart-footer">
          <div class="flex items-center justify-between mb-2 text-base font-bold">
            <span>Subtotal</span>
            <span id="qc-subtotal-val">$0.00</span>
          </div>
          <p class="text-xs text-muted mb-4">Taxes and shipping calculated at checkout.</p>
          <div class="flex flex-col gap-2">
            <a href="checkout.html" class="btn btn-primary btn-block text-center py-2.5 font-semibold text-sm">Checkout Now &rarr;</a>
            <a href="cart.html" class="btn btn-outline btn-block text-center py-2 text-xs" style="color: var(--color-text-primary);">View Full Cart Page &rarr;</a>
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(drawerBackdrop);

    // Close button & backdrop click listeners
    const closeBtn = document.getElementById('qc-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) closeCartDrawer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerBackdrop.classList.contains('open')) {
        closeCartDrawer();
      }
    });
  } else {
    drawerBackdrop = document.getElementById('quick-cart-backdrop');
  }

  // Intercept navbar cart buttons across all pages (except checkout.html)
  if (!window.location.pathname.endsWith('checkout.html')) {
    const navCartBtns = document.querySelectorAll('#nav-cart-btn, .cart-button, [data-open-cart]');
    navCartBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCartDrawer();
      });
    });
  }

  // Listen for cart changes
  window.addEventListener('cart-updated', () => {
    if (drawerBackdrop && drawerBackdrop.classList.contains('open')) {
      renderDrawerContent();
    }
  });
}

export function openCartDrawer() {
  if (!drawerBackdrop) initCartDrawer();
  renderDrawerContent();
  drawerBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeCartDrawer() {
  if (!drawerBackdrop) return;
  drawerBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function renderDrawerContent() {
  const itemsList = document.getElementById('qc-items-list');
  const countLabel = document.getElementById('qc-item-count');
  const subtotalVal = document.getElementById('qc-subtotal-val');
  const shippingLabel = document.getElementById('qc-shipping-delta');
  const shippingFill = document.getElementById('qc-shipping-fill');

  const items = getCartItems();
  const totalCount = getCartItemCount();
  const subtotal = getCartSubtotal();

  if (countLabel) countLabel.textContent = totalCount;
  if (subtotalVal) subtotalVal.textContent = formatCurrency(subtotal);

  // Free shipping threshold ($100)
  const freeThreshold = 100;
  if (shippingLabel && shippingFill) {
    if (subtotal >= freeThreshold) {
      shippingLabel.textContent = '🎉 You unlocked FREE Shipping!';
      shippingFill.style.width = '100%';
    } else {
      const delta = freeThreshold - subtotal;
      shippingLabel.textContent = `${formatCurrency(delta)} away from Free Shipping`;
      shippingFill.style.width = `${Math.min(100, (subtotal / freeThreshold) * 100)}%`;
    }
  }

  if (!itemsList) return;

  if (items.length === 0) {
    itemsList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-secondary);">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin: 0 auto 0.75rem; opacity: 0.4;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p class="font-medium text-sm mb-1">Your cart is empty</p>
        <p class="text-xs text-muted mb-4">Discover minimal apparel, footwear, & carry essentials.</p>
        <a href="products.html" class="btn btn-outline btn-sm" onclick="closeCartDrawer()">Explore Shop &rarr;</a>
      </div>
    `;
    return;
  }

  itemsList.innerHTML = items.map((item, idx) => {
    const { id, name, price, quantity, image, selectedSize, selectedColor } = item;
    return `
      <div class="qc-item-row" data-id="${id}">
        <img src="${formatProductImage(image)}" alt="${name}" class="qc-item-thumb" onerror="this.src='../assets/product_tee.png'">
        <div>
          <h4 class="qc-item-title">${name}</h4>
          <div class="qc-item-price">${formatCurrency(price)} ${selectedSize ? `• ${selectedSize}` : ''}</div>
          <div class="qc-qty-ctrl">
            <button type="button" class="qc-qty-btn qc-minus-btn" data-id="${id}">-</button>
            <span class="qc-qty-val">${quantity}</span>
            <button type="button" class="qc-qty-btn qc-plus-btn" data-id="${id}">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="font-bold text-sm mb-2">${formatCurrency(price * quantity)}</div>
          <button type="button" class="qc-remove-btn" data-id="${id}" title="Remove item">&times; Remove</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach quantity & remove event listeners
  itemsList.querySelectorAll('.qc-minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const current = items.find(i => i.id === id);
      if (current) {
        if (current.quantity > 1) {
          updateCartQuantity(id, current.quantity - 1);
        } else {
          removeFromCart(id);
        }
      }
    });
  });

  itemsList.querySelectorAll('.qc-plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const current = items.find(i => i.id === id);
      if (current) {
        updateCartQuantity(id, current.quantity + 1);
      }
    });
  });

  itemsList.querySelectorAll('.qc-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      removeFromCart(id);
    });
  });
}

// Auto init on module load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartDrawer);
  } else {
    initCartDrawer();
  }
}
