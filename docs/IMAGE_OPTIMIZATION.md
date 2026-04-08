Universal Image Optimization Guide
Last updated: 2026-04-09

================================================================================

WHAT THIS IS FOR

Use this guide on any web project to keep image quality high while reducing
load time, bandwidth, and browser CPU/memory pressure.

================================================================================

1. MAIN RULES (SIMPLE)

  1. Always resize images to the size you actually render — not larger.
  2. Always use a modern format with auto quality (e.g. f_auto, q_auto).
  3. Use different presets for card, hero, and thumbnail views.
  4. Use a low-quality placeholder (LQIP/blur) for better perceived speed.
  5. Lazy-load any image that isn't critical to the first paint.

================================================================================

2. UNIVERSAL PRESETS

These three presets cover most e-commerce and content projects.

--------------------------------------------------------------------------------
CARD IMAGE PRESET
Use for: product cards, rails, list pages

  Aspect ratio:  4:5
  Target width:  480px
  Transform:     c_fill,g_auto,ar_4:5,w_480,f_auto,q_auto:good
  LQIP:          c_fill,g_auto,ar_4:5,w_20,q_10,e_blur:200
  Sizes attr:    (max-width: 640px) 90vw, (max-width: 1024px) 45vw, 480px

--------------------------------------------------------------------------------
HERO / LARGE MEDIA PRESET
Use for: hero banners, main gallery image, large modal media

  Aspect ratio:  16:9
  Target width:  900px
  Transform:     c_fill,g_auto,ar_16:9,w_900,f_auto,q_auto:good
  LQIP:          c_fill,g_auto,ar_16:9,w_20,q_10,e_blur:200
  Sizes attr:    (max-width: 640px) 100vw, 900px

--------------------------------------------------------------------------------
THUMBNAIL PRESET
Use for: cart rows, gallery thumbs, mini cards

  Aspect ratio:  1:1
  Target width:  160px
  Transform:     c_fill,g_auto,ar_1:1,w_160,f_auto,q_auto:good
  Sizes attr:    (max-width: 640px) 25vw, 160px

================================================================================

3. UPLOAD STANDARDS (FOR CONTENT EDITORS)

Ask editors to always upload:
  - Minimum 1600x2000px for product images
  - Subject centered in the frame
  - One clean source image per product — all variants are derived from this

Why this size works: it renders well in 4:5 card view, crops cleanly to 16:9
and 1:1, and means you never need to maintain separate files per surface.

================================================================================

4. WHAT NOT TO DO

  - Do not store transformed URLs in the database — store only the original.
  - Do not stack multiple transforms on the same URL string repeatedly.
  - Do not serve raw original images directly in the UI.
  - Do not use one preset for every surface.

================================================================================

5. RECOMMENDED IMPLEMENTATION PATTERN

  1. Store only the original media URL in the database.
  2. Build the transformed URL at render time using a helper function.
  3. Use one helper for the normal image and a separate one for the LQIP.
  4. Keep all preset names and constants defined in one place.

In this repo, helper examples live in: lib/cloudinary.ts

================================================================================

6. CURRENT PROJECT MAPPING (REFERENCE)

Surfaces where image presets are currently applied:

  - components/client/ProductCard.tsx
  - components/client/ProductModal.tsx
  - app/[domain]/(client)/buy/[productId]/page.tsx
  - components/client/cart/CartClient.tsx
  - components/client/CartDrawer.tsx

When adding a new image surface, pick one of the three presets above. Don't
invent new dimensions from scratch.

================================================================================

7. QUICK VERIFICATION CHECKLIST

  [ ] Card images use the card preset
  [ ] Hero images use the hero preset
  [ ] Thumbnails use the thumbnail preset
  [ ] Non-critical images are lazy-loaded
  [ ] LQIP/blur placeholders are enabled where needed
  [ ] No transformed URLs are stored in the database
  [ ] Network tab shows optimized sizes and modern formats (WebP/AVIF)

If all boxes are checked, image delivery is in good shape for most projects.