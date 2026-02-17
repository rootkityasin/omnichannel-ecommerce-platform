import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    quantity: number;
    image?: string;
    modifiers?: string; // e.g., "Spice: Naga"
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    checkoutOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    openCheckout: () => void;
    closeCheckout: () => void;
    addItem: (item: CartItem) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;

    coupon: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number } | null;
    applyCoupon: (coupon: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number }) => void;
    removeCoupon: () => void;

    total: () => number; // Item Subtotal
    discount: () => number; // Calculated discount
    finalTotal: () => number; // Payable amount

    // Cached Products for Recommendations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allProducts: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAllProducts: (products: any[]) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            checkoutOpen: false,
            coupon: null,
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCheckout: () => set({ checkoutOpen: true }),
            closeCheckout: () => set({ checkoutOpen: false }),
            addItem: (item) =>
                set((state) => {
                    const existingItem = state.items.find(
                        (i) => i.id === item.id && i.modifiers === item.modifiers
                    );

                    const onCartPage = typeof window !== 'undefined' && window.location.pathname === '/cart';
                    // Don't auto-open if on cart page (unless already open, but usually we just want to avoid forcing it true)
                    // If manually toggled, isOpen state is respected. Here we are forcing it.
                    // Let's just set it to 'true' only if NOT on cart page.
                    const shouldOpen = !onCartPage;

                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id && i.modifiers === item.modifiers
                                    ? { ...i, quantity: i.quantity + item.quantity }
                                    : i
                            ),
                            isOpen: shouldOpen ? true : state.isOpen, // Only force open if not on cart page, otherwise keep current state
                        };
                    }
                    return { items: [...state.items, item], isOpen: shouldOpen ? true : state.isOpen };
                }),
            removeItem: (itemId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId),
                })),
            clearCart: () => set({ items: [], coupon: null }),
            total: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),

            applyCoupon: (coupon) => set({ coupon }),
            removeCoupon: () => set({ coupon: null }),

            discount: () => {
                const { coupon, total } = get();
                if (!coupon) return 0;

                const subTotal = total();
                if (coupon.type === 'PERCENTAGE') {
                    return Math.floor((subTotal * coupon.value) / 100);
                } else {
                    return Math.min(coupon.value, subTotal);
                }
            },

            finalTotal: () => {
                const total = get().total(); // This uses the getter from inside the object specifically? No, get().total() works
                const discount = get().discount();
                return Math.max(0, total - discount);
            },

            allProducts: [],
            setAllProducts: (products) => set({ allProducts: products }),
        }),
        {
            name: 'crabkhai-cart',
            partialize: (state) => ({ items: state.items, coupon: state.coupon, allProducts: state.allProducts }),
        }
    )
);
