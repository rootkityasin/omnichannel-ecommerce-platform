'use client';

import dynamic from 'next/dynamic';

const InventoryTabs = dynamic(
    () => import('./InventoryTabs').then(mod => mod.InventoryTabs),
    { ssr: false }
);

export function DynamicInventoryTabs(props: any) {
    return <InventoryTabs {...props} />;
}
