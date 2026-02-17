'use client';

import dynamic from 'next/dynamic';

const InventoryTabs = dynamic(
    () => import('./InventoryTabs').then(mod => mod.InventoryTabs),
    { ssr: false }
);

import { Expense, StockProduct } from "@/types/common";

interface DynamicInventoryTabsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any;
    expenses: Expense[];
    products: StockProduct[];
}

export function DynamicInventoryTabs(props: DynamicInventoryTabsProps) {
    return <InventoryTabs {...props} />;
}
