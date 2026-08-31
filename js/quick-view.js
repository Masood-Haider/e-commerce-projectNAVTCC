// ==========================================================================
// PRODUCT QUICK VIEW & PREVIEW MODAL MODULE
// Displays interactive product preview & purchase dialog without page navigation
// ==========================================================================

import { getProductById } from './firestore.js';
import { addToCart, getCartItemCount } from './cart.js';
import { 
  formatCurrency, 
  formatProductImage, 
  showToast, 
  triggerBadgePop, 
  triggerCartBounce 
} from './utils.js';

let modalOverlay = null;
let currentPreviewProduct = null;
let selectedQuantity = 1;
let selectedOption = '';

/**
 * Injects the Quick View modal structure into the DOM if not already present
 */
function ensureModalDOM() {
  if (modalOverlay) return;

  modalOverlay = document.getElementById('quick-view-modal');
  if (modalOverlay) return;

  modalOverlay = document.createElement('div');
  modalOverlay.id = 'quick-view-modal';
  modalOverlay.className = 'quick-view-overlay';
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');
  modalOverlay.setAttribute('aria-labelledby', 'qv-product-title');
  modalOverlay.setAttribute('data-lenis-prevent', 'true');

  modalOverlay.innerHTML = `
    <div class="quick-view-card" id="quick-view-card" data-lenis-prevent="true">
      <button type="button" class="quick-view-close-btn" id="quick-view-close" aria-label="Close product preview">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="quick-view-body" id="quick-view-body">
        <!-- Injected Dynamically -->
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Close handlers
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeQuickView();
    }
  });

  const closeBtn = modalOverlay.querySelector('#quick-view-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeQuickView);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeQuickView();
    }
  });
}

/**
 * Closes the Quick View preview modal
 */
export function closeQuickView() {
  if (modalOverlay) {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (window.__auraLenis) window.__auraLenis.start();
  }
}

/**
 * Opens and renders the Quick View modal for a given product ID
 */
export async function openQuickView(productId) {
  if (!productId) return;
  ensureModalDOM();

  const body = document.getElementById('quick-view-body');
  if (!body) return;

  // Show loading shimmer state inside modal
  body.innerHTML = `
    <div class="quick-view-grid">
      <div class="quick-view-gallery">
        <div class="skeleton-shimmer" style="width: 100%; aspect-ratio: 1/1; border-radius: var(--radius-lg);"></div>
      </div>
      <div class="quick-view-info flex flex-col gap-3">
        <div class="skeleton-shimmer" style="height: 16px; width: 30%; border-radius: var(--radius-xs);"></div>
        <div class="skeleton-shimmer" style="height: 28px; width: 85%; border-radius: var(--radius-xs);"></div>
        <div class="skeleton-shimmer" style="height: 22px; width: 40%; border-radius: var(--radius-xs);"></div>
        <div class="skeleton-shimmer" style="height: 60px; width: 100%; border-radius: var(--radius-xs); margin-top: 8px;"></div>
        <div class="skeleton-shimmer" style="height: 44px; width: 100%; border-radius: var(--radius-md); margin-top: 16px;"></div>
      </div>
    </div>
  `;

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.__auraLenis) window.__auraLenis.stop();

  try {
    const product = await getProductById(productId);
    if (!product) {
      body.innerHTML = `
        <div class="p-8 text-center">
          <h3 class="text-lg font-bold mb-2">Product Not Found</h3>
          <p class="text-sm text-secondary mb-4">Unable to load product preview.</p>
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('quick-view-modal').classList.remove('open')">Close</button>
        </div>
      `;
      return;
    }

    currentPreviewProduct = product;
    selectedQuantity = 1;

    const {
      id,
      title = 'Product',
      price = 0,
      category = 'General',
      image = '../assets/product_tee.png',
      description = '',
      rating = 5.0,
      reviewsCount = 12,
      stock = 10,
      badge = null,
      sizes = []
    } = product;

    selectedOption = sizes?.[0] || '';

    body.innerHTML = `
      <div class="quick-view-grid">
        
        <!-- Left: Image Gallery -->
        <div class="quick-view-gallery">
          <div class="quick-view-img-box">
            ${badge ? `<span class="badge ${badge === 'New' ? 'badge-accent' : badge === 'Low Stock' ? 'badge-warning' : 'badge-neutral'} quick-view-badge">${badge}</span>` : ''}
            <img 
              src="${formatProductImage(image)}" 
              alt="${title}" 
              class="quick-view-img"
              onerror="this.src='../assets/product_tee.png'"
            >
          </div>
        </div>

        <!-- Right: Details & Purchase -->
        <div class="quick-view-info">
          
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-accent uppercase text-xs">${category}</span>
            <span class="text-xs ${stock > 0 ? 'text-success font-medium' : 'text-danger'} ml-auto">
              ${stock > 0 ? `● In Stock (${stock} available)` : '○ Out of Stock'}
            </span>
          </div>

          <h2 class="quick-view-title" id="qv-product-title">${title}</h2>
          
          <!-- Rating -->
          <div class="flex items-center gap-2 mb-3 text-xs text-secondary">
            <span class="font-bold text-primary">★ ${(rating || 5).toFixed(1)}</span>
            <span>•</span>
            <span>(${reviewsCount || 0} reviews)</span>
          </div>

          <!-- Price -->
          <div class="quick-view-price mb-4">${formatCurrency(price)}</div>

          <!-- Short Description -->
          <p class="quick-view-desc mb-5">
            ${description || 'Timeless essential crafted with premium materials designed for longevity.'}
          </p>

          <!-- Sizing / Options (if available) -->
          ${sizes && sizes.length > 0 ? `
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <label class="text-xs font-semibold text-secondary uppercase">Select Size / Option</label>
                <span class="text-xs text-primary font-medium" id="qv-active-option">${selectedOption}</span>
              </div>
              <div class="flex flex-wrap gap-2" id="qv-options-group">
                ${sizes.map((s, idx) => `
                  <button type="button" class="option-btn ${idx === 0 ? 'active' : ''}" data-option="${s}">${s}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Quantity Selector -->
          <div class="mb-5">
            <label class="text-xs font-semibold text-secondary uppercase mb-2 block">Quantity</label>
            <div class="flex items-center gap-3">
              <div class="qty-counter">
                <button type="button" class="qty-btn" id="qv-qty-minus" aria-label="Decrease quantity">&minus;</button>
                <input type="number" id="qv-qty-input" class="qty-input" value="1" min="1" max="${stock}" readonly>
                <button type="button" class="qty-btn" id="qv-qty-plus" aria-label="Increase quantity">&plus;</button>
              </div>
              <span class="text-xs text-muted">Max ${stock} units</span>
            </div>
          </div>

          <!-- Add to Cart & Full Details Button -->
          <div class="flex flex-col gap-2 pt-2">
            <button type="button" id="qv-btn-add-to-cart" class="btn btn-primary btn-lg w-full" ${stock <= 0 ? 'disabled' : ''}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Add to Cart &bull; <span id="qv-btn-price">${formatCurrency(price)}</span></span>
            </button>

            <a href="product-details.html?id=${id}" class="btn btn-ghost btn-sm w-full justify-center text-center mt-1" id="qv-view-full-page">
              View Full Description & Details &rarr;
            </a>
          </div>

        </div>

      </div>
    `;

    // Handle Option Selection
    const optionBtns = body.querySelectorAll('#qv-options-group .option-btn');
    const optionLabel = body.querySelector('#qv-active-option');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        optionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedOption = btn.dataset.option;
        if (optionLabel) optionLabel.textContent = selectedOption;
      });
    });

    // Handle Quantity Adjustments
    const qtyInput = body.querySelector('#qv-qty-input');
    const btnMinus = body.querySelector('#qv-qty-minus');
    const btnPlus = body.querySelector('#qv-qty-plus');
    const btnPriceLabel = body.querySelector('#qv-btn-price');

    const updatePrice = () => {
      if (btnPriceLabel) {
        btnPriceLabel.textContent = formatCurrency(price * selectedQuantity);
      }
    };

    if (btnMinus && qtyInput) {
      btnMinus.addEventListener('click', () => {
        if (selectedQuantity > 1) {
          selectedQuantity--;
          qtyInput.value = selectedQuantity;
          updatePrice();
        }
      });
    }

    if (btnPlus && qtyInput) {
      btnPlus.addEventListener('click', () => {
        if (selectedQuantity < stock) {
          selectedQuantity++;
          qtyInput.value = selectedQuantity;
          updatePrice();
        } else {
          showToast(`Maximum stock reached (${stock} units).`, 'warning');
        }
      });
    }

    // Handle Add to Cart
    const btnAddToCart = body.querySelector('#qv-btn-add-to-cart');
    if (btnAddToCart) {
      btnAddToCart.addEventListener('click', () => {
        addToCart({
          id,
          name: title,
          price: parseFloat(price) || 0,
          category,
          image,
          selectedSize: selectedOption
        }, selectedQuantity);

        // Broadcast cart change so all components update
        window.dispatchEvent(new CustomEvent('cart-updated'));

        // Animations
        triggerBadgePop();
        triggerCartBounce();
        showToast(`Added ${selectedQuantity} × "${title}" to your cart.`, 'success');

        // Button Micro-Feedback
        const originalHTML = btnAddToCart.innerHTML;
        btnAddToCart.innerHTML = `
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>✓ Added to Cart!</span>
        `;
        btnAddToCart.style.backgroundColor = 'var(--color-success)';
        btnAddToCart.style.borderColor = 'var(--color-success)';

        setTimeout(() => {
          btnAddToCart.innerHTML = originalHTML;
          btnAddToCart.style.backgroundColor = '';
          btnAddToCart.style.borderColor = '';
        }, 1500);
      });
    }

  } catch (err) {
    console.error('[QuickView] Error opening product preview:', err);
    body.innerHTML = `
      <div class="p-8 text-center">
        <h3 class="text-lg font-bold mb-2 text-danger">Error Loading Preview</h3>
        <p class="text-sm text-secondary mb-4">Please try viewing the full product page directly.</p>
        <a href="product-details.html?id=${productId}" class="btn btn-primary btn-sm">Go to Product Page &rarr;</a>
      </div>
    `;
  }
}

/**
 * Attaches click delegation to a container for product cards:
 * - Clicking the image, card, or title navigates directly to full product-details.html.
 * - Clicking the + Add button executes quick cart addition.
 * - Clicking the Preview button opens the Quick View modal.
 */
export function attachProductCardListeners(container) {
  if (!container) return;

  container.addEventListener('click', (e) => {
    // 1. Direct Title Link or Explicit Details Link: Let browser navigate to product-details.html
    const titleLink = e.target.closest('.product-name a, .product-title-link, a[href*="product-details.html"]');
    if (titleLink) {
      return;
    }

    // 2. Quick Add Button: Handled by quick add listener
    const quickAddBtn = e.target.closest('.product-quick-add');
    if (quickAddBtn) {
      return;
    }

    // 3. Quick View / Preview Button ONLY
    const quickViewBtn = e.target.closest('.btn-quick-view');
    if (quickViewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const productCard = e.target.closest('.product-card');
      const productId = productCard?.dataset?.productId || productCard?.getAttribute('data-product-id');
      if (productId) {
        openQuickView(productId);
      }
      return;
    }

    // 4. Clicking the image or card body navigates directly to product description page
    const productCard = e.target.closest('.product-card');
    if (productCard) {
      const productId = productCard.dataset.productId || productCard.getAttribute('data-product-id');
      if (productId) {
        window.location.href = `product-details.html?id=${productId}`;
      }
    }
  });
}
