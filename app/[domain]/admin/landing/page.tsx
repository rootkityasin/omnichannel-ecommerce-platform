'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GripVertical, Save, X, Loader2, LayoutTemplate, MessageSquare, ImageIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { StoryEditor } from '@/components/admin/StoryEditor';
import { CartEditor } from '@/components/admin/CartEditor';
import { getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide, updateHeroSlideOrder } from '@/app/actions/hero';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ slide, onEdit, onDelete }: { slide: any, onEdit: (s: any) => void, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <Card className="overflow-hidden group relative flex flex-col h-full border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <div
                    className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1.5 bg-white/80 backdrop-blur rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4 text-slate-600" />
                </div>

                <div className="relative h-48 bg-slate-100">
                    {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge className={`${slide.isActive ? 'bg-green-500' : 'bg-slate-400'} text-white border-none shadow-sm`}>
                            {slide.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                        <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{slide.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2">{slide.subtitle}</p>
                        {slide.title_bn && <p className="text-xs text-slate-400 mt-2 font-bangla">{slide.title_bn}</p>}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                        <Button variant="outline" size="sm" onClick={() => onEdit(slide)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <button onClick={() => onDelete(slide.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function LandingPage() {
    const [slides, setSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        setLoading(true);
        const data = await getHeroSlides();
        setSlides(data);
        setLoading(false);
    };

    const handleEdit = (slide: any) => {
        setCurrentSlide(slide);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentSlide({
            title: '', title_bn: '',
            subtitle: '', subtitle_bn: '',
            buttonText: 'Order Now', buttonLink: '/menu',
            imageUrl: '', isActive: true
        });
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // @ts-ignore
            if (currentSlide.id) {
                // @ts-ignore
                await updateHeroSlide(currentSlide.id, currentSlide);
                toast.success('Slide updated');
            } else {
                // Calculate new order (last + 1)
                const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) : -1;
                await createHeroSlide({ ...currentSlide, order: maxOrder + 1 });
                toast.success('Slide created');
            }
            setIsEditing(false);
            loadSlides();
        } catch (error) {
            toast.error('Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;
        try {
            await deleteHeroSlide(id);
            toast.success('Slide deleted');
            loadSlides();
        } catch (error) {
            toast.error('Failed to delete slide');
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setSlides((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                const orderUpdates = newItems.map((item, index) => ({ id: item.id, order: index }));
                updateHeroSlideOrder(orderUpdates); // Fire and forget

                return newItems;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Landing Page</h1>
                    <p className="text-sm text-slate-500">Manage your homepage sections.</p>
                </div>
            </div>

            <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="hero">Hero Carousel</TabsTrigger>
                    {/* Placeholder for future sections */}
                    <TabsTrigger value="story">Our Story</TabsTrigger>
                    <TabsTrigger value="cart">Cart</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add Slide
                        </Button>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={slides.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {slides.map((slide) => (
                                        <SortableItem
                                            key={slide.id}
                                            slide={slide}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {slides.length === 0 && !loading && (
                        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No slides yet. Add your first one!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="story" className="mt-6">
                    <StoryEditor />
                </TabsContent>

                <TabsContent value="cart" className="mt-6">
                    <CartEditor />
                </TabsContent>
            </Tabs>

            {/* Edit Modal */}
            {isEditing && currentSlide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <Card className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 p-0 overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {currentSlide.id ? 'Edit Slide' : 'New Slide'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Slide Image (Landscape)</Label>
                                <ImageUpload
                                    value={currentSlide.imageUrl}
                                    onChange={(url) => setCurrentSlide({ ...currentSlide, imageUrl: url })}
                                    onRemove={() => setCurrentSlide({ ...currentSlide, imageUrl: '' })}
                                    recommendedSize="1920x800"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* English Content */}
                                <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">English Content</Label>
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={currentSlide.title}
                                            onChange={e => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                            placeholder="e.g. Jumbo Shrimp"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Subtitle</Label>
                                        <Input
                                            value={currentSlide.subtitle}
                                            onChange={e => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                                            placeholder="e.g. Grilled to perfection"
                                        />
                                    </div>
                                </div>

                                {/* Bengali Content */}
                                <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Bengali Content</Label>
                                    <div className="space-y-2">
                                        <Label>Title (BN)</Label>
                                        <Input
                                            value={currentSlide.title_bn || ''}
                                            onChange={e => setCurrentSlide({ ...currentSlide, title_bn: e.target.value })}
                                            placeholder="e.g. বিশাল চিংড়ি"
                                            className="font-bangla"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Subtitle (BN)</Label>
                                        <Input
                                            value={currentSlide.subtitle_bn || ''}
                                            onChange={e => setCurrentSlide({ ...currentSlide, subtitle_bn: e.target.value })}
                                            placeholder="e.g. নিখুঁতভাবে গ্রিল করা"
                                            className="font-bangla"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <Label>Button Text</Label>
                                    <Input
                                        value={currentSlide.buttonText}
                                        onChange={e => setCurrentSlide({ ...currentSlide, buttonText: e.target.value })}
                                        placeholder="Order Now"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Button Link</Label>
                                    <Input
                                        value={currentSlide.buttonLink}
                                        onChange={e => setCurrentSlide({ ...currentSlide, buttonLink: e.target.value })}
                                        placeholder="/menu"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={currentSlide.isActive}
                                        onCheckedChange={(c) => setCurrentSlide({ ...currentSlide, isActive: c })}
                                    />
                                    <Label>Active</Label>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px]">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Slide'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
