// ==========================================================================
// AURA E-COMMERCE - LENIS SMOOTH SCROLLING
// External library: Lenis (https://github.com/darkroomengineering/lenis)
// Provides modern inertial momentum smooth scrolling across all devices
// ==========================================================================

export function initSmoothScroll() {
  if (typeof window === 'undefined') return;

  function runLenis() {
    if (typeof window.Lenis === 'undefined') return;
    if (window.__auraLenis) return window.__auraLenis;

    const lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
      prevent: (node) => {
        if (!node || !node.closest) return false;
        return node.closest('.modal-card, .modal-overlay, [data-lenis-prevent], .quick-cart-drawer, .quick-cart-items-list, select, textarea') !== null;
      }
    });

    window.__auraLenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
          }
        }
      });
    });

    return lenis;
  }

  if (window.Lenis) {
    runLenis();
  } else {
    const existing = document.querySelector('script[src*="lenis"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js';
      script.async = true;
      script.onload = runLenis;
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', runLenis);
    }
  }
}

// Auto-initialize when loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScroll);
  } else {
    initSmoothScroll();
  }
}
