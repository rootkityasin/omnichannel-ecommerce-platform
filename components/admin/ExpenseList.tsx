"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/app/actions/inventory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Expense } from "@/types/common";

const getCategoryColor = (category: string) => {
  switch (category) {
    case "PROCUREMENT":
      return "bg-blue-100 text-blue-600";
    case "MARKETING":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export function ExpenseList({ expenses }: Readonly<{ expenses: Expense[] }>) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteExpense(id);
    if (res.success) {
      toast.success("Expense deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getCategoryColor(expense.category)}`}
            >
              {expense.category[0]}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{expense.title}</h4>
              <p className="text-xs text-slate-500">
                {format(new Date(expense.date), "PP")} • {expense.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-red-600">
              -৳{Math.abs(expense.amount)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-red-500"
              onClick={() => handleDelete(expense.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      {expenses.length === 0 && (
        <p className="text-center text-slate-400 py-8">
          No expenses recorded yet.
        </p>
      )}
    </div>
  );
}
