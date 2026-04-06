"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type ComboItem = {
  childId?: string;
  quantity: number;
};

type ProductOption = {
  id: string;
  name: string;
  type?: string;
};

export default function ComboBuilder({
  comboItems,
  setComboItems,
  products,
}: {
  comboItems: ComboItem[];
  setComboItems: (items: ComboItem[]) => void;
  products: ProductOption[];
}) {
  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
      <label className="text-sm font-bold text-slate-700 block">
        Combo Contents
      </label>
      {comboItems.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Select
            value={item.childId}
            onValueChange={(val) => {
              const updated = [...comboItems];
              updated[idx].childId = val;
              setComboItems(updated);
            }}
          >
            <SelectTrigger className="flex-1 text-xs h-8">
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {products
                .filter((p) => p.type !== "COMBO")
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            className="w-20 h-8 text-xs"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => {
              const updated = [...comboItems];
              updated[idx].quantity = Math.max(
                0,
                parseInt(e.target.value) || 0,
              );
              setComboItems(updated);
            }}
            min={0}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500"
            onClick={() => {
              setComboItems(comboItems.filter((_, i) => i !== idx));
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full text-xs border-dashed"
        onClick={() =>
          setComboItems([...comboItems, { childId: "", quantity: 1 }])
        }
      >
        <Plus className="w-3 h-3 mr-1" /> Add Ingredient
      </Button>
    </div>
  );
}
