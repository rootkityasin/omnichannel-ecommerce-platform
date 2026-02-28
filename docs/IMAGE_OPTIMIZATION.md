# Image Optimization Notes

This project uses Cloudinary for image hosting and Next/Image for delivery.
Use the helpers in `lib/cloudinary.ts` to keep transformations consistent.

## Why this matters

- Faster LCP and lower data usage for mobile users.
- Consistent crops across cards, hero, and thumbnails.
- Minimal manual work when a single image is uploaded.

## Canonical crops and sizes

These are the standard crops used across the UI.

### Product Cards (Home/Menu/Rails)

- Crop: 4:5 portrait
- Width: 480px
- Transform: `c_fill,g_auto,ar_4:5,w_480,f_auto,q_auto:good`
- LQIP: `c_fill,g_auto,ar_4:5,w_20,q_10,e_blur:200`
- sizes: `(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 480px`

### Hero / Product Modal

- Crop: 16:9 wide
- Width: 900px
- Transform: `c_fill,g_auto,ar_16:9,w_900,f_auto,q_auto:good`
- LQIP: `c_fill,g_auto,ar_16:9,w_20,q_10,e_blur:200`
- sizes: `(max-width: 640px) 100vw, 900px`

### Thumbnails / Cart

- Crop: 1:1 square
- Width: 160px
- Transform: `c_fill,g_auto,ar_1:1,w_160,f_auto,q_auto:good`
- sizes: `(max-width: 640px) 25vw, 160px`

## Helpers

Use `buildCloudinaryUrl` and `buildCloudinaryLqip` from:

- `lib/cloudinary.ts`

These helpers insert the transform after `/upload/` in Cloudinary URLs and keep behavior consistent.

## Admin upload guidance

For product images, the admin UI recommends:

- `1600x2000 (4:5)` and to center the subject.

Rationale:

- Works well for cards (4:5)
- Still crops cleanly for hero (16:9) and thumbnails (1:1)

## Do not

- Do not store transformed URLs in the database.
- Do not add multiple transformations to the same URL.
- Avoid serving original images without `f_auto,q_auto` and a width.

## Where to update

If you add new image surfaces, follow the same presets above.
Common areas:

- `components/client/ProductCard.tsx`
- `components/client/ProductModal.tsx`
- `app/[domain]/(client)/buy/[productId]/page.tsx`
- `components/client/cart/CartClient.tsx`
- `components/client/CartDrawer.tsx`
