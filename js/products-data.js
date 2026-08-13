// ==========================================================================
// PRODUCTS DATA MODULE (Firestore Schema Compatible)
// Static dataset & query utilities using native array methods (map, filter, find)
// ==========================================================================

export const PRODUCTS = [
  {
    id: 'prod-101',
    title: 'Organic Cotton Heavyweight Tee',
    price: 48.00,
    category: 'apparel',
    image: '../assets/product_tee.png',
    description: 'Cut from heavyweight 240 GSM organic combed cotton for a relaxed, structured silhouette. Features double-needle stitched collar and cuffs for everyday durability and minimal shrinkage.',
    details: [
      '100% Certified Organic Combed Cotton (240 GSM)',
      'Pre-shrunk fabric with enzyme wash finish',
      'Reinforced ribbed crewneck collar',
      'Ethically crafted in Porto, Portugal'
    ],
    rating: 4.9,
    reviewsCount: 128,
    stock: 45,
    badge: 'New',
    featured: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Bone White', 'Black']
  },
  {
    id: 'prod-102',
    title: 'Minimalist Leather Sneaker',
    price: 165.00,
    category: 'footwear',
    image: '../assets/product_sneaker.png',
    description: 'An understated luxury court sneaker made with supple full-grain Italian leather and custom vulcanized natural rubber outsoles. Engineered for all-day cushioning and sleek aesthetics.',
    details: [
      'Full-grain Italian calfskin leather upper',
      'Butter-soft calfskin lining with cushioned footbed',
      'Durable Margom-style natural rubber cupsole',
      'Handcrafted in Marche, Italy'
    ],
    rating: 4.8,
    reviewsCount: 94,
    stock: 18,
    badge: 'Best Seller',
    featured: true,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Optic White', 'Off-White / Gum']
  },
  {
    id: 'prod-103',
    title: 'Ceramic Minimalist Watch',
    price: 220.00,
    category: 'accessories',
    image: '../assets/product_watch.png',
    description: 'A 38mm matte black ceramic case housing a high-precision Japanese quartz movement with sapphire crystal glass and an interchangeable vegetable-tanned leather strap.',
    details: [
      '38mm Matte Ceramic Casing (5ATM Water Resistant)',
      'Scratch-resistant Sapphire Crystal glass',
      'Miyota Precision Japanese Quartz Movement',
      'Quick-release Italian vegetable-tanned leather strap'
    ],
    rating: 5.0,
    reviewsCount: 62,
    stock: 7,
    badge: 'Low Stock',
    featured: true,
    sizes: ['38mm', '42mm'],
    colors: ['Matte Black', 'Brushed Silver']
  },
  {
    id: 'prod-104',
    title: 'Modular Commuter Backpack',
    price: 185.00,
    category: 'carry',
    image: '../assets/product_backpack.png',
    description: 'Constructed from 840D waterproof Cordura ballistic nylon with weatherproof YKK Aquaguard zippers. Includes a padded 16-inch laptop compartment and ergonomic shoulder straps.',
    details: [
      '840D Recycled Cordura Ballistic Nylon',
      'Weatherproof YKK Aquaguard zippers throughout',
      'Dedicated suspended 16" laptop sleeve',
      'Luggage pass-through and hidden passport pocket'
    ],
    rating: 4.9,
    reviewsCount: 86,
    stock: 24,
    badge: null,
    featured: true,
    sizes: ['20L Capacity'],
    colors: ['Charcoal Black', 'Slate Grey']
  },
  {
    id: 'prod-105',
    title: 'Polarized Titanium Sunglasses',
    price: 145.00,
    category: 'accessories',
    image: '../assets/product_sunglasses.png',
    description: 'Ultra-lightweight Japanese aerospace-grade titanium wire frames fitted with category 3 polarized lenses offering 100% UVA/UVB protection and anti-reflective coating.',
    details: [
      'Ultralight Grade 5 Japanese Titanium Frame',
      'Custom CR-39 Polarized Lenses (100% UV400 Protection)',
      'Screwless engineered micro-hinges',
      'Includes recycled leather protective case & microfiber cloth'
    ],
    rating: 4.7,
    reviewsCount: 43,
    stock: 15,
    badge: 'New',
    featured: false,
    sizes: ['Standard Fit'],
    colors: ['Matte Black', 'Gunmetal']
  },
  {
    id: 'prod-106',
    title: 'Slim Bifold Leather Cardholder',
    price: 65.00,
    category: 'accessories',
    image: '../assets/product_wallet.png',
    description: 'Precision-cut French Chèvre leather cardholder with hand-painted beveled edges and RFID-blocking central compartment. Holds 6-8 cards plus folded cash without bulk.',
    details: [
      'Vegetable-tanned French Chèvre leather',
      'Hand-burnished and painted edge finish',
      'Built-in RFID protective shielding',
      'Thickness under 6mm when loaded'
    ],
    rating: 4.9,
    reviewsCount: 110,
    stock: 32,
    badge: 'Best Seller',
    featured: false,
    sizes: ['One Size'],
    colors: ['Noir Black', 'Caramel Tan']
  },
  {
    id: 'prod-107',
    title: 'Heavyweight Loopback Hoodie',
    price: 120.00,
    category: 'apparel',
    image: '../assets/product_hoodie.png',
    description: 'Crafted from 480 GSM French loopback organic cotton fleece. Designed with a double-lined structured hood, seamless kangaroo pocket, and heavy ribbed hems.',
    details: [
      '480 GSM 100% Organic French Loopback Cotton',
      'Double-lined hood with zero drawstrings for minimal clean drape',
      'Flatlock comfort stitching throughout',
      'Garment dyed for rich vintage patina'
    ],
    rating: 4.8,
    reviewsCount: 75,
    stock: 20,
    badge: null,
    featured: false,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Washed Black', 'Heather Grey']
  },
  {
    id: 'prod-108',
    title: 'Italian Suede Chelsea Boot',
    price: 240.00,
    category: 'footwear',
    image: '../assets/product_boots.png',
    description: 'Classic refined silhouette crafted from water-repellent Tuscan suede with tonal elastic side gussets, Goodyear welted leather soles, and protective rubber inserts.',
    details: [
      'Water-resistant Italian Tuscan suede',
      'Goodyear welted construction for resoleability',
      'Full leather lining with dual woven pull tabs',
      'Handmade in Tuscany, Italy'
    ],
    rating: 5.0,
    reviewsCount: 39,
    stock: 9,
    badge: 'Limited',
    featured: false,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Deep Black', 'Espresso Brown']
  }
];

/**
 * Get all products
 */
export function getAllProducts() {
  return [...PRODUCTS];
}

/**
 * Find single product by ID
 */
export function getProductById(id) {
  if (!id) return null;
  return PRODUCTS.find(p => p.id.toLowerCase() === id.toLowerCase()) || null;
}

/**
 * Get featured products
 */
export function getFeaturedProducts() {
  return PRODUCTS.filter(p => p.featured);
}

/**
 * Get related products within same category, excluding the active product
 */
export function getRelatedProducts(productId, category, limit = 4) {
  return PRODUCTS
    .filter(p => p.id !== productId && (!category || p.category.toLowerCase() === category.toLowerCase()))
    .slice(0, limit);
}

/**
 * Filter and sort products using array methods
 */
export function filterProducts({
  query = '',
  category = '',
  sort = 'featured',
  inStockOnly = false,
  dataset = PRODUCTS
} = {}) {
  let result = [...(dataset || PRODUCTS)];

  // Search by query (title or description or category)
  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    result = result.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Filter by category
  if (category && category !== 'all') {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by in-stock
  if (inStockOnly) {
    result = result.filter(p => p.stock > 0);
  }

  // Sorting
  switch (sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
    case 'featured':
    default:
      // Keep curated order / featured first
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
  }

  return result;
}
