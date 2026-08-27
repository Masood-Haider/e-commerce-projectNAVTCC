// ==========================================================================
// UTILITY HELPERS
// Formatting, DOM helpers, and toast notifications
// ==========================================================================

import { initSmoothScroll } from './smooth-scroll.js';
export { initSmoothScroll };

/**
 * Format numeric amount to USD currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Format ISO date string to clean readable date
 */
export function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  try {
    const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch {
    return 'N/A';
  }
}

/**
 * Format and normalize product image paths.
 * Allows entering just the filename (e.g. 'jacket.png' or 'jacket') and automatically maps it to '../assets/filename'
 */
export function formatProductImage(imgPath) {
  if (!imgPath || typeof imgPath !== 'string') return '../assets/product_tee.png';
  let cleaned = imgPath.trim();
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('data:')) {
    return cleaned;
  }
  // Strip leading relative path prefixes (../ or ./)
  cleaned = cleaned.replace(/^(\.\.\/|\.\/|\/)+/, '');
  // Strip 'assets/' if present
  if (cleaned.startsWith('assets/')) {
    cleaned = cleaned.replace(/^assets\//, '');
  }
  // If user didn't include extension, default to .png
  if (!cleaned.includes('.')) {
    cleaned += '.png';
  }
  return `../assets/${cleaned}`;
}

/**
 * Parse URL query parameters into an object
 */
export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/**
 * Display a minimalist non-intrusive toast notification
 */
export function showToast(message, type = 'neutral') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: calc(100vw - 40px);
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  let accentDot = 'var(--color-primary)';

  if (type === 'success') {
    borderColor = 'rgba(34, 197, 94, 0.4)';
    accentDot = '#22c55e';
  } else if (type === 'danger') {
    borderColor = 'rgba(239, 68, 68, 0.4)';
    accentDot = '#ef4444';
  } else if (type === 'warning') {
    borderColor = 'rgba(245, 158, 11, 0.4)';
    accentDot = '#f59e0b';
  }

  toast.style.cssText = `
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background-color: #09090b;
    color: #ffffff;
    border: 1px solid ${borderColor};
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.22s cubic-bezier(0.2, 0, 0.2, 1);
    pointer-events: auto;
  `;

  toast.innerHTML = `
    <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${accentDot}; flex-shrink: 0;"></span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto-remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/**
 * Initialize native IntersectionObserver for smooth scroll-reveal animations
 */
export function initScrollReveal(selector = '.reveal-on-scroll', threshold = 0.12) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    document.querySelectorAll(selector).forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold
  });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

/**
 * Trigger pop animation on cart badge counter
 */
export function triggerBadgePop(badgeElement) {
  const el = badgeElement || document.getElementById('cart-count-badge');
  if (!el) return;
  el.classList.remove('badge-pop');
  void el.offsetWidth;
  el.classList.add('badge-pop');
}

/**
 * Trigger bounce animation on cart navigation icon
 */
export function triggerCartBounce(cartIconElement) {
  const el = cartIconElement || document.getElementById('nav-cart-btn') || document.querySelector('.cart-icon-wrap');
  if (!el) return;
  el.classList.remove('cart-bounce');
  void el.offsetWidth;
  el.classList.add('cart-bounce');
}

/**
 * Attach real-time input validation feedback
 */
export function attachRealtimeValidation(inputEl, validateFn) {
  if (!inputEl) return;
  
  const validate = () => {
    const val = inputEl.value;
    if (!val || val.trim() === '') {
      inputEl.classList.remove('is-valid', 'is-invalid');
      return;
    }
    const isValid = validateFn(val);
    if (isValid) {
      inputEl.classList.add('is-valid');
      inputEl.classList.remove('is-invalid');
    } else {
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
    }
  };

  inputEl.addEventListener('input', validate);
  inputEl.addEventListener('blur', validate);
}

/**
 * Initialize Smooth Dark Split-Screen Curtain Preloader Intro
 */
export function initSplashIntro(forceShow = false) {
  if (typeof window === 'undefined') return;

  // Check if splash has already been shown in this browser session
  if (!forceShow && sessionStorage.getItem('aura_splash_shown')) {
    const existing = document.getElementById('aura-splash-overlay');
    if (existing) {
      existing.style.display = 'none';
      existing.remove();
    }
    return;
  }
  sessionStorage.setItem('aura_splash_shown', 'true');

  let overlay = document.getElementById('aura-splash-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'aura-splash-overlay';
    overlay.innerHTML = `
      <div class="aura-splash-curtain-top"></div>
      <div class="aura-splash-brand">
        <div class="aura-splash-logo-text">A U R A</div>
        <div class="aura-splash-tagline">Studio • Minimalist Essentials</div>
      </div>
      <div class="aura-splash-curtain-bottom"></div>
    `;
    if (document.body && document.body.firstChild) {
      document.body.insertBefore(overlay, document.body.firstChild);
    } else if (document.body) {
      document.body.appendChild(overlay);
    }
  }

  if (overlay) {
    overlay.style.display = 'flex';
  }

  // Prevent scrolling during splash animation
  if (document.body) {
    document.body.style.overflow = 'hidden';
  }

  // Smooth curtain split sequence
  setTimeout(() => {
    if (overlay) overlay.classList.add('animating');
  }, 500);

  setTimeout(() => {
    if (overlay) overlay.classList.add('done');
    if (document.body) document.body.style.overflow = '';
  }, 2250);
}

// Auto-run splash intro immediately
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initSplashIntro());
  } else {
    initSplashIntro();
  }
}
