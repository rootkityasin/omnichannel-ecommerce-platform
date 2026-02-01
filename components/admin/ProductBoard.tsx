'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Share2, Edit, Copy, Trash2, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragStartEvent, DragOverEvent, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    price: number;
    stage: string;
    image: string;
    stock: boolean;
    pieces: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

interface ProductBoardProps {
    products: Product[];
    onMove: (id: string, newStage: string, quantity?: number) => void;
    config?: any;
    onEdit?: (product: any) => void;
    onClone?: (product: any) => void;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
}

function SortableItem({ product, formatStock, children, disabled }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: product.id,
        data: { type: 'Item', product },
        disabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            {children}
        </div>
    );
}

function DroppableColumn({ col, products, renderCard, formatStock, readOnly }: any) {
    const { setNodeRef } = useDroppable({
        id: col.stage,
        disabled: readOnly
    });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100 min-w-[280px] w-[85vw] md:w-auto md:flex-1 flex-shrink-0 snap-center">
            <div className="p-3 border-b border-gray-100 font-bold">
                <span className={`text-sm ${col.color.split(' ')[1]}`}>
                    {col.title} <span className="text-slate-400 font-normal">({products.length})</span>
                </span>
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {products.map((product: any) => (
                    <SortableItem key={product.id} product={product} formatStock={formatStock} disabled={readOnly}>
                        {renderCard(product)}
                    </SortableItem>
                ))}
                {products.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                        {readOnly ? "Empty" : "Drop Here"}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ProductBoard({ products, onMove, config, onEdit, onClone, onDelete, readOnly }: ProductBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [moveRequest, setMoveRequest] = useState<{ id: string, stage: string, product: Product } | null>(null);
    const [moveQty, setMoveQty] = useState<number | ''>('');
    const [activeColumn, setActiveColumn] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const isRestaurant = config?.shopType === 'RESTAURANT';

    const columns = isRestaurant ? [
        { title: 'Ready Stock', stage: 'Draft', color: 'bg-gray-100 text-gray-500' },
        { title: 'Ready to Process', stage: 'Ready to Process', color: 'bg-indigo-100 text-indigo-600' },
        { title: 'Ready To Fry', stage: 'Ready To Fry', color: 'bg-orange-100 text-orange-600' },
        { title: 'Live / Selling', stage: 'Selling', color: 'bg-green-100 text-green-600' },
        { title: 'Sold', stage: 'Sold', color: 'bg-purple-100 text-purple-600' },
    ] : [
        { title: 'Draft / Hidden', stage: 'Draft', color: 'bg-gray-100 text-gray-500' },
        { title: 'Coming Soon', stage: 'Coming Soon', color: 'bg-blue-100 text-blue-600' },
        { title: 'Live / Selling', stage: 'Selling', color: 'bg-green-100 text-green-600' },
        { title: 'Archived', stage: 'Archived', color: 'bg-slate-100 text-slate-400' },
    ];

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    );

    const formatStock = (pieces: number, unitWeight: number = 200) => {
        const unit = config?.measurementUnit || 'PCS';
        if (unit === 'VOLUME') {
            const totalVolume = pieces * unitWeight;
            return totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)} Ltr (${pieces})` : `${totalVolume} ml (${pieces})`;
        }
        if (unit === 'WEIGHT') {
            const weight = pieces * unitWeight;
            const display = weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight} g`;
            return `${display} (${pieces})`;
        }
        return `Stock: ${pieces}`;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveProduct(products.find(p => p.id === active.id) || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Optional: Could handle optimistic sorting here but simplest is just stage monitoring
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveProduct(null);

        if (!over) return;

        // Dropped on a column (droppable container)
        const overId = over.id as string;
        // Check if overId is a stage name 
        const isStage = columns.some(c => c.stage === overId);
        const currentProduct = active.data.current?.product;

        if (!currentProduct) return;

        if (isStage && overId !== currentProduct.stage) {
            if (isRestaurant) {
                // Restaurant Split Flow
                setMoveRequest({ id: active.id as string, stage: overId, product: currentProduct });
                setMoveQty(currentProduct.pieces || 0); // Default to full amount
                setDialogOpen(true);
            } else {
                // Standard Move
                onMove(active.id as string, overId, currentProduct.pieces);
            }
        }
    };

    const confirmMove = () => {
        if (moveRequest && moveQty) {
            onMove(moveRequest.id, moveRequest.stage, Number(moveQty));
            setDialogOpen(false);
            setMoveRequest(null);
            setMoveQty('');
        }
    };

    // Helper to render card
    const renderCard = (product: any) => (
        <Card key={product.id} className="p-3 cursor-grab hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm border-gray-100 mb-2">
            <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={product.image || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</h4>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <span>৳{product.price}</span>
                        <span>•</span>
                        <span>{formatStock((product as any).pieces || 0, (product as any).weight || 200)}</span>
                        {product.stage !== 'Draft' && !readOnly && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onMove(product.id, 'Draft');
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="ml-1 w-5 h-5 rounded bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors"
                                title="Return to Ready Stock"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Only show actions for non-Ready Stock items */}
                {product.stage !== 'Draft' && (onEdit || onClone || onDelete) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-slate-300 hover:text-slate-600 flex-shrink-0">
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/buy/${product.id}`);
                                toast.success('Link Copied!', {
                                    className: 'bg-green-600 text-white border-green-700',
                                    description: 'Product link copied to clipboard'
                                });
                            }}>
                                <Share2 className="w-4 h-4 mr-2" /> Share Link
                            </DropdownMenuItem>
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(product)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                            )}
                            {onClone && (
                                <DropdownMenuItem onClick={() => onClone(product)}>
                                    <Copy className="w-4 h-4 mr-2" /> Clone
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(product.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </Card>
    );

    // Handle scroll to track active column
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const columnWidth = scrollContainerRef.current.offsetWidth * 0.85; // 85vw
        const newActive = Math.round(scrollLeft / columnWidth);
        setActiveColumn(Math.min(newActive, columns.length - 1));
    };

    // Scroll to a specific column
    const scrollToColumn = (index: number) => {
        if (!scrollContainerRef.current) return;
        const columnWidth = scrollContainerRef.current.offsetWidth * 0.85;
        scrollContainerRef.current.scrollTo({ left: columnWidth * index, behavior: 'smooth' });
        setActiveColumn(index);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            {/* Mobile Column Tabs - only on small screens */}
            <div className="md:hidden overflow-x-auto mb-3 -mx-2 px-2">
                <div className="flex gap-2 min-w-max">
                    {columns.map((col, index) => (
                        <button
                            key={col.stage}
                            onClick={() => scrollToColumn(index)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${activeColumn === index
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {col.title.split('/')[0].trim()} ({products.filter(p => p.stage === col.stage).length})
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 h-[calc(100vh-280px)] md:h-[calc(100vh-200px)] overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none"
            >
                {columns.map((col) => {
                    // For Ready Stock, sort by name. For processing stages, sort by time (newest first)
                    const stageProducts = products
                        .filter(p => p.stage === col.stage)
                        .sort((a, b) => {
                            if (col.stage === 'Draft') {
                                // Ready Stock: Sort by name
                                return a.name.localeCompare(b.name);
                            }
                            // Processing stages: Sort by updatedAt (oldest first)
                            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                            return dateA - dateB;
                        });

                    return (
                        <SortableContext key={col.stage} id={col.stage} items={stageProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            <DroppableColumn col={col} products={stageProducts} renderCard={renderCard} formatStock={formatStock} readOnly={readOnly} />
                        </SortableContext>
                    );
                })}
            </div>
            <DragOverlay>
                {activeProduct ? renderCard(activeProduct) : null}
            </DragOverlay>

            {/* Quantity Dialog */}
            {dialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-2">Move to {
                            columns.find(c => c.stage === moveRequest?.stage)?.title
                        }</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            How many items do you want to move?
                            <br />
                            Max available: <strong>{moveRequest?.product.stock ? (
                                // @ts-ignore
                                moveRequest.product.pieces || 0
                            ) : 0}</strong>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    // @ts-ignore
                                    max={moveRequest?.product.pieces || 1}
                                    value={moveQty}
                                    onChange={(e) => setMoveQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button onClick={confirmMove} disabled={!moveQty || Number(moveQty) <= 0}>Confirm Move</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DndContext>
    );
}
