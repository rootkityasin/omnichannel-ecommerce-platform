'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStock } from "@/app/actions/inventory";
import { getSiteConfig } from "@/app/actions/settings";
import { toast } from "sonner";
import { Search, Plus, Minus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AdminProduct, SiteConfig, StockProduct } from "@/types/common";
import Image from "next/image";

export function StockList({ products }: Readonly<{ products: StockProduct[] }>) {
    const [searchTerm, setSearchTerm] = useState("");


    // Adjustment State
    const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
    const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
    const [amount, setAmount] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

    useEffect(() => {
        getSiteConfig().then(setSiteConfig);
    }, []);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openAdjustModal = (product: StockProduct, type: 'add' | 'remove') => {
        setSelectedProduct(product);
        setAdjustType(type);
        setAmount("");
        setIsDialogOpen(true);
    };

    const handleAdjustment = async () => {
        if (!selectedProduct || !amount) return;

        const inputVal = Number.parseFloat(amount || '0');
        if (inputVal <= 0) {
            toast.error("Invalid amount");
            return;
        }

        // NEW LOGIC: Input IS the Weight (Grams/Ml) or Pieces (if PCS)
        // No multiplication needed for Weight/Volume modes anymore as per user request.
        const delta = adjustType === 'add' ? inputVal : -inputVal;

        // Optimistic check for removal (if applicable)
        if (adjustType === 'remove' && selectedProduct.pieces < inputVal) {
            toast.error("Cannot remove more than current stock");
            return;
        }


        const res = await adjustStock(selectedProduct.id, delta);
        if (res.success) {
            const unit = siteConfig?.measurementUnit || 'PCS';
            const action = adjustType === 'add' ? 'added' : 'removed';
            const msg = unit === 'WEIGHT'
                ? `${inputVal}g ${action}`
                : `${inputVal} ${action}`;
            toast.success(msg);
            setIsDialogOpen(false);
        } else {
            toast.error("Failed to adjust stock");
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-slate-500 font-medium border-b">
                        <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-center">Current Stock</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((p) => {
                            // Removed unused isLowStock
                            return (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-medium text-slate-800">
                                        <div className="flex items-center gap-3">
                                            {p.image ? (
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                    <Image
                                                        src={p.image}
                                                        alt={p.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                                    <span className="text-[10px] text-slate-400">Img</span>
                                                </div>
                                            )}
                                            <div>
                                                {p.name}
                                                <div className="text-xs text-slate-400">{p.category.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        {p.type === 'COMBO' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {(() => {
                                                    // Calculate Virtual Stock
                                                    if (!p.comboItems || p.comboItems.length === 0) return '0 Sets';
                                                    const limits = p.comboItems.map((item) =>
                                                        item.child ? Math.floor(item.child.pieces / item.quantity) : 0
                                                    );
                                                    return `${Math.min(...limits)} Sets`;
                                                })()}
                                            </span>
                                        ) : (
                                            (() => {
                                                const unit = siteConfig?.measurementUnit || 'PCS';

                                                if (unit === 'PCS') {
                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.pieces < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                            {p.pieces} Pcs
                                                        </span>
                                                    );
                                                }

                                                // Use global settings for unit value
                                                // const unitValue removed as it was unused/shadowed

                                                if (unit === 'VOLUME') {
                                                    // p.pieces is Total ml
                                                    const totalVolume = p.pieces;
                                                    const unitValue = siteConfig?.volumeUnitValue || 1000;
                                                    const units = Math.floor(totalVolume / unitValue);
                                                    const display = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)} Ltr` : `${totalVolume} ml`;

                                                    const isLowStock = units < 10;
                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                            {display}
                                                            <span className="ml-1 opacity-75">({units} units)</span>
                                                        </span>
                                                    );
                                                }

                                                // Default to WEIGHT - pieces IS grams
                                                const weightInGrams = p.pieces;
                                                const weightUnitVal = siteConfig?.weightUnitValue || 200;
                                                const units = Math.floor(weightInGrams / weightUnitVal);
                                                const isLowStock = units < 10; // Standardized: Low stock if < 10 units
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {weightInGrams >= 1000
                                                            ? `${(weightInGrams / 1000).toFixed(1)} kg`
                                                            : `${weightInGrams} g`
                                                        }
                                                        <span className="ml-1 opacity-75">({units} units)</span>
                                                    </span>
                                                );
                                            })()
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-green-200 hover:bg-green-50 text-green-700"
                                                onClick={() => openAdjustModal(p, 'add')}
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Add
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-red-200 hover:bg-red-50 text-red-700"
                                                onClick={() => openAdjustModal(p, 'remove')}
                                            >
                                                <Minus className="w-4 h-4 mr-1" /> Remove
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">No products found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Adjustment Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{adjustType === 'add' ? 'Add Stock' : 'Remove Stock'}</DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.name} - Current: {(() => {
                                const unit = siteConfig?.measurementUnit || 'PCS';
                                if (unit === 'PCS') return `${selectedProduct?.pieces} Pcs`;
                                const unitVal = unit === 'WEIGHT' ? (siteConfig?.weightUnitValue || 200) : (siteConfig?.volumeUnitValue || 1000);
                                const total = (selectedProduct?.pieces || 0) * unitVal;
                                if (unit === 'WEIGHT') {
                                    return total >= 1000 ? `${(total / 1000).toFixed(1)} kg (${selectedProduct?.pieces} units)` : `${total} g (${selectedProduct?.pieces} units)`;
                                }
                                return total >= 1000 ? `${(total / 1000).toFixed(1)} Ltr (${selectedProduct?.pieces})` : `${total} ml (${selectedProduct?.pieces})`;
                            })()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            {siteConfig?.measurementUnit !== 'PCS' && (selectedProduct?.weight || siteConfig?.weightUnitValue) ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">
                                        {adjustType === 'add' ? 'Add' : 'Remove'} {siteConfig?.measurementUnit === 'WEIGHT' ? 'Weight (grams)' : 'Volume (ml)'}
                                        <span className="font-normal ml-1">(Input raw {siteConfig?.measurementUnit === 'WEIGHT' ? 'g' : 'ml'})</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            autoFocus
                                            min={0}
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                        <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-3 rounded border whitespace-nowrap">
                                            ≈ {(Number(amount || 0) / (selectedProduct?.weight || siteConfig?.weightUnitValue || 1)).toFixed(1)} Units
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">
                                        Quantity to {adjustType === 'add' ? 'add' : 'remove'}
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        autoFocus
                                        min={0}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            className={adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleAdjustment}
                        >
                            {adjustType === 'add' ? 'Add Stock' : 'Remove Stock'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
