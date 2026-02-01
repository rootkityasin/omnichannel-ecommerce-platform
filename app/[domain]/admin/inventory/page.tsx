import { getInventoryStats, getExpenses, getProductsForStock } from "@/app/actions/inventory";
import { DynamicInventoryTabs } from "@/components/admin/DynamicInventoryTabs";
import { ClipboardList } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const stats = await getInventoryStats();
    const expenses = await getExpenses();
    const products = await getProductsForStock();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-orange-600" />
                    Inventory & Expenses
                </h1>
                <p className="text-slate-500 mt-1">Manage your product stock and track business expenses separately.</p>
            </div>

            <DynamicInventoryTabs
                stats={stats}
                expenses={expenses}
                products={products}
            />
        </div>
    );
}
