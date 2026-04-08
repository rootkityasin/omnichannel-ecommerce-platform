export const CARD_PRODUCT_SELECT = {
  id: true,
  name: true,
  name_bn: true,
  price: true,
  image: true,
  images: true,
  categoryId: true,
  pieces: true,
  weight: true,
  totalSold: true,
  type: true,
  createdAt: true,
  nutritionImage: true,
  cookingImage: true,
  stage: true,
  sku: true,
  isAvailable: true,
  servingSize: true,
  comboItems: {
    include: {
      child: { select: { pieces: true, servingSize: true } },
    },
  },
  sections: {
    select: { slug: true },
  },
} as const;
