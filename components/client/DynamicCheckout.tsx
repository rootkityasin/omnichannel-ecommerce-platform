'use client';

import dynamic from 'next/dynamic';

const GlobalCheckoutDrawer = dynamic(
    () => import('./GlobalCheckoutDrawer').then(mod => mod.GlobalCheckoutDrawer),
    { ssr: false }
);

export function DynamicCheckout() {
    return <GlobalCheckoutDrawer />;
}
