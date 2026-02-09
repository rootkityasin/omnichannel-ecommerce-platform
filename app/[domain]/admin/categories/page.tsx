'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { LucideIcon } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '@/app/actions/category';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionsManager } from '@/components/admin/SectionsManager';
import {
    Plus,
    X,
    Trash2,
    Fish,
    Flame,
    Utensils,
    Drumstick,
    Soup,
    Shell,
    Snowflake,
    Package,
    Gift,
    Waves,
    Pizza,
    Beef,
    Microwave,
    Coffee,
    Apple,
    Candy,
    Cookie,
    Egg,
    IceCream,
    Milk,
    Cherry,
    Croissant,
    Beer,
    Wine,
    Sandwich,
    Salad,
    Banana,
    Bean,
    Cake,
    Carrot,
    Citrus,
    CupSoda,
    Grape,
    Lollipop,
    Nut,
    Popcorn,
    Rabbit,
    Sprout,
    Wheat,
    Zap,
    Bird,
    Bone,
    GlassWater,
    Sparkles,
    Star,
    Heart,
    Truck,
    Store,
    ShoppingBag,
    Home,
    Timer,
    Smile
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCategoryStyle } from '@/components/client/CategoryNav';

const ICON_OPTIONS = [
    // --- Base & Utility ---
    { label: 'Package (Default)', value: 'Package', icon: Package },
    { label: 'Flame (Spicy)', value: 'Flame', icon: Flame },
    { label: 'Zap (Energy)', value: 'Zap', icon: Zap },
    { label: 'Heart (Healthy)', value: 'Heart', icon: Heart },
    { label: 'Star (Featured)', value: 'Star', icon: Star },
    { label: 'Sparkles (New)', value: 'Sparkles', icon: Sparkles },
    { label: 'Snowflake (Frozen)', value: 'Snowflake', icon: Snowflake },
    { label: 'Waves (Fresh)', value: 'Waves', icon: Waves },
    { label: 'Gift (Offer)', value: 'Gift', icon: Gift },
    { label: 'Microwave (Ready)', value: 'Microwave', icon: Microwave },
    { label: 'Timer (Quick)', value: 'Timer', icon: Timer },
    { label: 'Utensils', value: 'Utensils', icon: Utensils },

    // --- Seafood & Proteins ---
    { label: 'Fish', value: 'Fish', icon: Fish },
    { label: 'Shell (Crab/Prawn)', value: 'Shell', icon: Shell },
    { label: 'Drumstick (Chicken)', value: 'Drumstick', icon: Drumstick },
    { label: 'Beef / Meat', value: 'Beef', icon: Beef },
    { label: 'Egg', value: 'Egg', icon: Egg },
    { label: 'Bird (Poultry)', value: 'Bird', icon: Bird },
    { label: 'Rabbit', value: 'Rabbit', icon: Rabbit },
    { label: 'Bone', value: 'Bone', icon: Bone },

    // --- Produce (Fruits/Veg) ---
    { label: 'Apple', value: 'Apple', icon: Apple },
    { label: 'Banana', value: 'Banana', icon: Banana },
    { label: 'Cherry', value: 'Cherry', icon: Cherry },
    { label: 'Citrus / Orange', value: 'Citrus', icon: Citrus },
    { label: 'Grape', value: 'Grape', icon: Grape },
    { label: 'Carrot', value: 'Carrot', icon: Carrot },
    { label: 'Salad / Leafy', value: 'Salad', icon: Salad },
    { label: 'Sprout', value: 'Sprout', icon: Sprout },
    { label: 'Bean', value: 'Bean', icon: Bean },
    { label: 'Wheat', value: 'Wheat', icon: Wheat },

    // --- Prepared Food ---
    { label: 'Pizza', value: 'Pizza', icon: Pizza },
    { label: 'Sandwich', value: 'Sandwich', icon: Sandwich },
    { label: 'Soup', value: 'Soup', icon: Soup },
    { label: 'Cake', value: 'Cake', icon: Cake },
    { label: 'Cookie', value: 'Cookie', icon: Cookie },
    { label: 'Croissant', value: 'Croissant', icon: Croissant },
    { label: 'Ice Cream', value: 'IceCream', icon: IceCream },
    { label: 'Lollipop', value: 'Lollipop', icon: Lollipop },
    { label: 'Candy', value: 'Candy', icon: Candy },
    { label: 'Popcorn', value: 'Popcorn', icon: Popcorn },
    { label: 'Nut', value: 'Nut', icon: Nut },

    // --- Drinks ---
    { label: 'Coffee', value: 'Coffee', icon: Coffee },
    { label: 'Milk', value: 'Milk', icon: Milk },
    { label: 'Beer', value: 'Beer', icon: Beer },
    { label: 'Wine', value: 'Wine', icon: Wine },
    { label: 'Soda / Cold Drink', value: 'CupSoda', icon: CupSoda },
    { label: 'Glass of Water', value: 'GlassWater', icon: GlassWater },

    // --- Meta & Shop ---
    { label: 'Truck (Delivery)', value: 'Truck', icon: Truck },
    { label: 'Store', value: 'Store', icon: Store },
    { label: 'Shopping Bag', value: 'ShoppingBag', icon: ShoppingBag },
    { label: 'Home', value: 'Home', icon: Home },
    { label: 'Smile', value: 'Smile', icon: Smile },
];

type CategoryItem = {
    id: string;
    name: string;
    _count?: {
        products?: number;
    };
};

const ICON_MAP: Record<string, LucideIcon> = {
    Fish, Flame, Utensils, Drumstick, Soup, Shell, Snowflake, Package, Gift, Waves, Pizza, Beef, Microwave, Coffee,
    Apple, Candy, Cookie, Egg, IceCream, Milk, Cherry, Croissant, Beer, Wine, Sandwich, Salad,
    Banana, Bean, Cake, Carrot, Citrus, CupSoda, Grape, Lollipop, Nut, Popcorn, Rabbit, Sprout, Wheat, Zap,
    Bird, Bone, GlassWater, Sparkles, Star, Heart, Truck, Store, ShoppingBag, Home, Timer, Smile
};

// Preview Component
function CategoryCardPreview({ name, animationType, iconName }: Readonly<{ name: string; animationType: string; iconName: string }>) {
    const style = getCategoryStyle(name || 'Preview', 0, animationType);
    const Icon = ICON_MAP[iconName] || ICON_MAP['Package'];

    return (
        <div className="w-full flex justify-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <div className="group relative w-32 h-32">
                <div className={`relative h-full flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm ${style.shadow} transition-all duration-500 overflow-hidden`}>
                    {/* Dynamic Hover Gradient for Preview */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-xl bg-slate-50 ${style.color} ${style.bg} group-hover:text-white shadow-inner transition-all duration-500 transform ${style.rotate}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-black text-slate-900 ${style.hoverText} text-center uppercase tracking-wider transition-colors duration-300`}>
                            {name || 'Category'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [animationType, setAnimationType] = useState('AUTO');
    const [iconName, setIconName] = useState('Package');
    const [iconSearch, setIconSearch] = useState('');

    const filteredIcons = ICON_OPTIONS.filter(opt =>
        opt.label.toLowerCase().includes(iconSearch.toLowerCase())
    );

    const fetchData = async () => {
        const data = await getCategories();
        setCategories(data as CategoryItem[]);
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        getCategories().then((data) => {
            if (!isMounted) return;
            setCategories(data as CategoryItem[]);
            setLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) {
            toast.error("Category name is required");
            return;
        }

        const res = await createCategory(newItemName, animationType, iconName);
        if (res.success) {
            toast.success("Category created");
            setIsModalOpen(false);
            setNewItemName('');
            setAnimationType('AUTO');
            setIconName('Package');
            fetchData();
        } else {
            toast.error("Failed to create");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category?")) return;
        const res = await deleteCategory(id);
        if (res.success) {
            toast.success("Deleted");
            fetchData();
        } else {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Menu Management</h1>
                    <p className="text-sm text-slate-500">Manage Categories and Home Page Sections.</p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                    <TabsTrigger value="categories">Categories (Menu)</TabsTrigger>
                    <TabsTrigger value="sections">Home Page Sections</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Product Categories</h2>
                        <Button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                        </Button>
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <Card className="w-full max-w-sm p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold">Add Category</h2>
                                    <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4" /></button>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <Input
                                        placeholder="Category Name (e.g. Meal)"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        autoFocus
                                    />

                                    <div className="space-y-2">
                                        <label htmlFor="category-animation" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Animation Style</label>
                                        <Select value={animationType} onValueChange={setAnimationType}>
                                            <SelectTrigger id="category-animation">
                                                <SelectValue placeholder="Select animation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AUTO">Auto (Alternating)</SelectItem>
                                                <SelectItem value="ROTATE_RIGHT">Rotate Right</SelectItem>
                                                <SelectItem value="ROTATE_LEFT">Rotate Left</SelectItem>
                                                <SelectItem value="FLOAT">Floating</SelectItem>
                                                <SelectItem value="BOUNCE">Bounce</SelectItem>
                                                <SelectItem value="PULSE">Pulse</SelectItem>
                                                <SelectItem value="SHAKE">Shake</SelectItem>
                                                <SelectItem value="FLIP">Flip</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="category-icon" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Icon</label>
                                        <Select value={iconName} onValueChange={setIconName}>
                                            <SelectTrigger id="category-icon">
                                                <SelectValue placeholder="Select icon" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                                <div className="p-2 border-b">
                                                    <Input
                                                        placeholder="Search icons..."
                                                        value={iconSearch}
                                                        onChange={(e) => setIconSearch(e.target.value)}
                                                        className="h-8 text-xs"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                {filteredIcons.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <div className="flex items-center gap-2">
                                                            <opt.icon className="w-4 h-4" />
                                                            <span>{opt.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {filteredIcons.length === 0 && (
                                                    <div className="p-2 text-xs text-center text-slate-400">No icons found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview</p>
                                        <CategoryCardPreview
                                            name={newItemName}
                                            animationType={animationType}
                                            iconName={iconName}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-orange-600">Create</Button>
                                </form>
                            </Card>
                        </div>
                    )}

                    <Card className="p-0 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Products</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                                        <td className="p-4 text-slate-500">{cat._count?.products || 0} items</td>
                                        <td className="p-4 text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(cat.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && categories.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-slate-400">No categories found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </TabsContent>

                <TabsContent value="sections">
                    <SectionsManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
