'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExpense } from "@/app/actions/inventory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddExpenseForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "PROCUREMENT",
        description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = Number(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount greater than 0");
            return;
        }

        setLoading(true);

        const res = await addExpense({
            title: formData.title,
            amount: amount,
            category: formData.category,
            description: formData.description
        });

        if (res.success) {
            toast.success("Expense added successfully");
            setFormData({ title: "", amount: "", category: "PROCUREMENT", description: "" });
            router.refresh();
        } else {
            toast.error("Failed to add expense");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Title</label>
                <Input
                    placeholder="e.g. Bought 20kg Crabs"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-white"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (৳)</label>
                <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0.01"
                    step="0.01"
                    className="bg-white"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PROCUREMENT">Procurement (Buying Stock)</SelectItem>
                        <SelectItem value="LOGISTICS">Logistics / Delivery</SelectItem>
                        <SelectItem value="PACKAGING">Packaging</SelectItem>
                        <SelectItem value="MARKETING">Marketing / Ads</SelectItem>
                        <SelectItem value="MEAL">Staff Meal / Food</SelectItem>
                        <SelectItem value="SALARY">Staff Salary</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800">
                {loading ? 'Saving...' : 'Add Expense'}
            </Button>
        </form>
    );
}
