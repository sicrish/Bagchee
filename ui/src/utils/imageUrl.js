/**
 * Image URL resolution for Bagchee.
 *
 * Storage formats in DB:
 *   1. Full URL:       "https://..."                 → returned as-is
 *   2. Local upload:   "/uploads/categories/img.jpg" → served from our API
 *   3. Slider image:   "20d39-baner2-2-.png"         → bagchee.com/assets/images/sliders/
 *   4. Numeric book ID: "139542.jpg"                 → use getProductImageUrl() with ISBN fallback
 *
 * Also handles object input (extracts defaultImage/image/picture field).
 */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const BAGCHEE_SLIDERS = 'https://www.bagchee.com/assets/images/sliders';

// Slider/banner filenames have a hex-hash prefix, e.g. "20d39-baner2-2-.png"
const isSliderFilename = (name) => /^[a-f0-9]+-/i.test(name);

/**
 * Inject Cloudinary auto-format/quality/width transforms into a Cloudinary URL.
 * e.g. .../upload/v123/img.jpg → .../upload/f_auto,q_auto,w_400/v123/img.jpg
 */
const addCloudinaryTransforms = (url, width) => {
  const transforms = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  return url.replace('/upload/', `/upload/${transforms}/`);
};

export const getImageUrl = (imgName, { width } = {}) => {
  // Handle object — extract the image field
  if (imgName && typeof imgName === 'object') {
    imgName = imgName.defaultImage || imgName.image || imgName.picture || '';
  }
  if (!imgName || typeof imgName !== 'string') return '';
  if (imgName.startsWith('http')) {
    // Apply Cloudinary transforms to Cloudinary-hosted images
    if (imgName.includes('res.cloudinary.com') && imgName.includes('/upload/')) {
      return addCloudinaryTransforms(imgName, width);
    }
    return imgName;
  }

  const clean = imgName.replace(/^\//, ''); // strip leading slash

  // Locally uploaded files served from our own API
  if (clean.startsWith('uploads/')) return `${API_BASE}/${clean}`;

  // Slider/banner image — confirmed accessible on bagchee.com
  if (isSliderFilename(clean)) return `${BAGCHEE_SLIDERS}/${clean}`;

  // Numeric book cover IDs (e.g. "139542.jpg") — path unknown, caller must use ISBN fallback
  return '';
};

/**
 * For product cards: resolves the best available cover image.
 * Priority: local upload/slider → Google Books (by ISBN) → empty string
 *
 * Google Books has broad Indian publisher coverage and returns a proper
 * redirect to the cover JPG, or 404 when not found (triggering onError).
 */
export const getProductImageUrl = (product, { width } = {}) => {
  if (!product || typeof product !== 'object') return '';

  // 1. Try local/slider image from stored filename
  const stored = getImageUrl(product, { width });
  if (stored) return stored;

  // 2. Google Books cover by ISBN — returns actual cover or 404 (triggers onError)
  const isbn = product.isbn13 || product.isbn10;
  if (isbn) return `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1`;

  return '';
};
