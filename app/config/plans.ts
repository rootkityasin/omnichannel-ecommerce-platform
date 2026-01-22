export const PLANS = [
    {
        id: 'BASIC',
        name: 'Basic',
        price: '$29',
        period: '/month',
        description: 'Perfect for small businesses just starting out.',
        features: [
            'Up to 1,000 Orders/mo',
            'Basic Analytics',
            'Email Support',
            '1 Admin User'
        ],
        color: 'bg-slate-500' // Visual badge color mapping if needed
    },
    {
        id: 'STANDARD',
        name: 'Standard',
        price: '$79',
        period: '/month',
        description: 'Ideal for growing shops with steady traffic.',
        features: [
            'Up to 10,000 Orders/mo',
            'Advanced Analytics',
            'Priority Email Support',
            'Custom Domain',
            '5 Admin Users'
        ],
        color: 'bg-amber-500' // Gold/Amber
    },
    {
        id: 'PLATINUM',
        name: 'Platinum',
        price: '$199',
        period: '/month',
        description: 'For high-volume enterprises demanding the best.',
        features: [
            'Unlimited Orders',
            'Real-time Analytics',
            '24/7 Phone Support',
            'Custom Domain & Branding',
            'Unlimited Admin Users',
            'Dedicated Account Manager'
        ],
        color: 'bg-emerald-500' // Platinum/Emerald
    }
];

export function getPlanDetails(planId: string) {
    return PLANS.find(p => p.id === planId) || PLANS[0]; // Default to Basic (or Free if we had it)
}
