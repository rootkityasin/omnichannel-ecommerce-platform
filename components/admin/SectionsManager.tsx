'use client';

import { useState, useEffect } from 'react';
import { getSections, createSection, updateSection, deleteSection, seedDefaultSections, reorderSections } from '@/app/actions/section';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to get color based on index
const getSectionStyle = (index: number, isDragging: boolean) => {
    // Professional "Lift" state: No rotation, solid white, clear shadow, slight scale
    if (isDragging) return "bg-white shadow-xl scale-[1.01] z-50 ring-1 ring-slate-200 border-l-orange-500 opacity-100";

    // Gradient logic: Top (Green) -> Middle (Yellow) -> Bottom (Subtle Red/Stone)
    if (index === 0) return "bg-emerald-50/40 border-l-emerald-500/50 hover:border-l-emerald-500";
    if (index === 1) return "bg-amber-50/40 border-l-amber-500/50 hover:border-l-amber-500";
    return "bg-slate-50/40 border-l-slate-300 hover:border-l-slate-400"; // Cleaner look
};

function SortableSection({ section, index, onDelete, onUpdate }: { section: any, index: number, onDelete: (id: string) => void, onUpdate: (id: string, updates: any) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative transition-all duration-300 ease-out">
            <Card
                className={`p-4 flex items-center gap-4 transition-all duration-300 border-l-4 ${getSectionStyle(index, isDragging)}`}
            >
                <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-2 hover:bg-black/5 rounded-md transition-colors">
                    <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1">
                    <Input
                        value={section.title}
                        onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                        className="font-bold border-transparent hover:border-black/10 focus:border-black/20 focus:bg-white/50 px-2 h-auto py-1 text-lg mb-1 bg-transparent rounded-md transition-all"
                    />
                    <div className="text-xs text-slate-500 flex gap-2 px-2">
                        <span className="font-mono bg-black/5 px-1 rounded">/{section.slug}</span>
                        <span>•</span>
                        <span>{section._count?.products || 0} Products</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                            {section.isActive ? 'Active' : 'Hidden'}
                        </span>
                        <Switch
                            checked={section.isActive}
                            onCheckedChange={(c) => onUpdate(section.id, { isActive: c })}
                        />
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(section.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export function SectionsManager() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newSection, setNewSection] = useState({ title: '', slug: '' });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchSections = async () => {
        setLoading(true);
        let data = await getSections();

        if (data.length === 0) {
            try {
                await seedDefaultSections();
                data = await getSections();
                toast.success("Initialized default sections");
            } catch (e) {
                console.error("Auto-seed failed", e);
            }
        }

        setSections(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleCreate = async () => {
        if (!newSection.title || !newSection.slug) return;
        const res = await createSection({
            ...newSection,
            order: sections.length
        });
        if (res.success) {
            toast.success("Section created");
            setIsAdding(false);
            setNewSection({ title: '', slug: '' });
            fetchSections();
        } else {
            toast.error("Failed to create");
        }
    };

    const handleUpdate = async (id: string, updates: any) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        const res = await updateSection(id, updates);
        if (!res.success) {
            toast.error("Failed to update");
            fetchSections();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this section?")) return;
        setSections(prev => prev.filter(s => s.id !== id));
        const res = await deleteSection(id);
        if (res.success) {
            toast.success("Deleted");
        } else {
            toast.error("Failed to delete");
            fetchSections();
        }
    };

    const params = useParams();
    const domain = params?.domain as string;

    const handleSeed = async () => {
        await seedDefaultSections(domain);
        toast.success("Defaults seeded");
        fetchSections();
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over!.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    order: index
                }));

                reorderSections(updates).then(res => {
                    if (!res.success) toast.error("Failed to save order");
                });

                return newItems;
            });
        }
    };

    // Auto-generate slug
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setNewSection({ title, slug });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-800">Home Page Sections</h2>
                    <p className="text-sm text-slate-500">Drag to prioritize sections on the home page.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSeed}><RefreshCw className="w-4 h-4 mr-2" /> Re-Seed Defaults</Button>
                    <Button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                    </Button>
                </div>
            </div>

            {isAdding && (
                <Card className="p-4 border-orange-100 bg-orange-50/50 mb-4 animate-in slide-in-from-top-2">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500">Title</label>
                            <Input
                                value={newSection.title}
                                onChange={handleTitleChange}
                                placeholder="e.g. Flash Sales"
                                className="bg-white"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500">URL Identifier</label>
                            <Input
                                value={newSection.slug}
                                onChange={e => setNewSection({ ...newSection, slug: e.target.value })}
                                placeholder="e.g. flash-sales"
                                className="bg-white"
                            />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                            <Button size="sm" onClick={handleCreate}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        </div>
                    </div>
                </Card>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3 pb-10">
                        {sections.map((section, index) => (
                            <SortableSection
                                key={section.id}
                                section={section}
                                index={index}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {!loading && sections.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed animate-pulse">
                    No sections found. Click "Re-Seed Defaults" to start.
                </div>
            )}
        </div>
    );
}
