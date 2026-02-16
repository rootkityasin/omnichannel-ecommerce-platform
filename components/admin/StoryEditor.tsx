'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getStorySections, updateStorySection, getAllProductsSimple } from '@/app/actions/story';
import { StoryLayout } from '@/components/client/Story/StoryLayout';
import { Eye } from 'lucide-react';
import {
    HeroContent, ValuesContent, GalleryItem, TeamMember,
    WholesaleContent, ReviewsContent, ProductsSectionContent
} from '@/types/common';

export function StoryEditor() {
    const [loading, setLoading] = useState(true);
    const [hero, setHero] = useState<HeroContent>({ title: '', subtitle: '', estYear: '', mascotImage: '' });
    const [values, setValues] = useState<ValuesContent>({ manifestoTitle: '', manifestoText: '', brandValues: [] });
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [wholesale, setWholesale] = useState<WholesaleContent>({ title: '', description: '', whatsappNumber: '', image: '' });
    const [reviews, setReviews] = useState<ReviewsContent>({ featuredImage: '', gridImages: [], reviews: [] });
    const [productsSection, setProductsSection] = useState<ProductsSectionContent>({ title: 'Our Signatures', productIds: [] });

    // Change detection
    const [originalState, setOriginalState] = useState<any>({});
    const checkChanges = (key: string, current: any) => {
        if (!originalState[key]) return false;
        return JSON.stringify(current) !== JSON.stringify(originalState[key]);
    };

    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('hero');

    const loadData = async () => {
        setLoading(true);
        const [sections, products] = await Promise.all([
            getStorySections(),
            getAllProductsSimple()
        ]);

        setAvailableProducts(products);

        const loadedState: any = {};
        sections.forEach((section: any) => {
            if (section.type === 'HERO') { setHero(section.content); loadedState['HERO'] = section.content; }
            if (section.type === 'VALUES') { setValues(section.content); loadedState['VALUES'] = section.content; }
            if (section.type === 'GALLERY') { setGallery(section.content); loadedState['GALLERY'] = section.content; }
            if (section.type === 'TEAM') { setTeam(section.content); loadedState['TEAM'] = section.content; }
            if (section.type === 'WHOLESALE') { setWholesale(section.content); loadedState['WHOLESALE'] = section.content; }
            if (section.type === 'REVIEWS') { setReviews(section.content); loadedState['REVIEWS'] = section.content; }
            if (section.type === 'PRODUCTS') { setProductsSection(section.content); loadedState['PRODUCTS'] = section.content; }
        });
        setOriginalState(loadedState);
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data fetching on mount
        loadData();
    }, []);

    useEffect(() => {
        // Scroll to section in preview when tab changes
        const sectionMap: Record<string, string> = {
            hero: 'story-section-hero',
            values: 'story-section-values',
            products: 'story-section-products',
            gallery: 'story-section-gallery',
            team: 'story-section-team',
            wholesale: 'story-section-wholesale',
            reviews: 'story-section-reviews'
        };

        const elementId = sectionMap[activeTab];
        if (elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [activeTab]);

    const handleSave = async (type: string, content: any) => {
        setSaving(type);
        const res = await updateStorySection(type, content);
        if (res.success) {
            toast.success(`${type} section updated`);
            setOriginalState({ ...originalState, [type]: content });
        } else {
            toast.error(`Failed to update ${type}`);
        }
        setSaving(null);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-[1600px] mx-auto">
            {/* Editor Column */}
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto bg-slate-100 p-1 rounded-lg mb-6 gap-1">
                        <TabsTrigger value="hero">Hero</TabsTrigger>
                        <TabsTrigger value="values">Values</TabsTrigger>
                        <TabsTrigger value="products" className="text-xs lg:text-sm">Prods</TabsTrigger>
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="wholesale" className="text-xs lg:text-sm">Wholesale</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hero" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Hero Section</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label>Main Title</Label>
                                    <Input value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })} placeholder="Our Story" />
                                </div>
                                <div>
                                    <Label>Subtitle / Description</Label>
                                    <Textarea value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} placeholder="A journey of flavor..." />
                                </div>
                                <div>
                                    <Label>Est. Year</Label>
                                    <Input value={hero.estYear} onChange={e => setHero({ ...hero, estYear: e.target.value })} placeholder="Est. 2023" />
                                </div>
                                <div>
                                    <Label>Mascot Image</Label>
                                    <ImageUpload value={hero.mascotImage} onChange={url => setHero({ ...hero, mascotImage: url as string })} onRemove={() => setHero({ ...hero, mascotImage: '' })} />
                                </div>
                                <Button
                                    disabled={saving === 'HERO'}
                                    onClick={() => handleSave('HERO', hero)}
                                    className={checkChanges('HERO', hero)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'HERO' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Hero
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="values" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Values & Manifesto</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label>Manifesto Title</Label>
                                    <Input value={values.manifestoTitle} onChange={e => setValues({ ...values, manifestoTitle: e.target.value })} placeholder="The Manifesto" />
                                </div>
                                <div>
                                    <Label>Manifesto Text</Label>
                                    <Textarea className="h-32" value={values.manifestoText} onChange={e => setValues({ ...values, manifestoText: e.target.value })} placeholder="So, it's 2023..." />
                                </div>
                                <div>
                                    <Label>Brand Values (Comma separated)</Label>
                                    <Input value={values.brandValues?.join(', ')} onChange={e => setValues({ ...values, brandValues: e.target.value.split(',').map((s: string) => s.trim()) })} placeholder="FRESH, ORGANIC, PREMIUM..." />
                                </div>
                                <Button
                                    disabled={saving === 'VALUES'}
                                    onClick={() => handleSave('VALUES', values)}
                                    className={checkChanges('VALUES', values)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'VALUES' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Values
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gallery" className="space-y-6">
                        <Card className="p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Gallery Images</h3>
                                <Button size="sm" onClick={() => setGallery([...gallery, { src: '', alt: '', rotate: 0 }])} variant="outline" ><Plus className="w-4 h-4 mr-2" /> Add Image</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {gallery.map((img, idx) => (
                                    <Card key={idx} className="p-4 space-y-3 relative group">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100" onClick={() => {
                                            const newG = [...gallery];
                                            newG.splice(idx, 1);
                                            setGallery(newG);
                                        }}><Trash2 className="w-4 h-4" /></Button>

                                        <ImageUpload value={img.src} onChange={url => {
                                            const newG = [...gallery];
                                            newG[idx].src = url as string;
                                            setGallery(newG);
                                        }} onRemove={() => {
                                            const newG = [...gallery];
                                            newG[idx].src = '';
                                            setGallery(newG);
                                        }} />
                                        <Input value={img.alt} onChange={e => {
                                            const newG = [...gallery];
                                            newG[idx].alt = e.target.value;
                                            setGallery(newG);
                                        }} placeholder="Caption" />
                                        <div className="flex items-center gap-2">
                                            <Label>Rotate (deg)</Label>
                                            <Input type="number" value={img.rotate} onChange={e => {
                                                const newG = [...gallery];
                                                newG[idx].rotate = parseInt(e.target.value);
                                                setGallery(newG);
                                            }} className="w-20" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <div className="mt-6">
                                <Button
                                    disabled={saving === 'GALLERY'}
                                    onClick={() => handleSave('GALLERY', gallery)}
                                    className={checkChanges('GALLERY', gallery)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'GALLERY' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Gallery
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-6">
                        <Card className="p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Team Members</h3>
                                <Button size="sm" onClick={() => setTeam([...team, { name: '', role: '', image: '', story: '' }])} variant="outline" ><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
                            </div>
                            <div className="space-y-6">
                                {team.map((member, idx) => (
                                    <Card key={idx} className="p-4 relative group">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100" onClick={() => {
                                            const newT = [...team];
                                            newT.splice(idx, 1);
                                            setTeam(newT);
                                        }}><Trash2 className="w-4 h-4" /></Button>

                                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-6">
                                            <div>
                                                <ImageUpload value={member.image} onChange={url => {
                                                    const newT = [...team];
                                                    newT[idx].image = url as string;
                                                    setTeam(newT);
                                                }} onRemove={() => {
                                                    const newT = [...team];
                                                    newT[idx].image = '';
                                                    setTeam(newT);
                                                }} />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Name</Label>
                                                        <Input value={member.name} onChange={e => {
                                                            const newT = [...team];
                                                            newT[idx].name = e.target.value;
                                                            setTeam(newT);
                                                        }} placeholder="Name" />
                                                    </div>
                                                    <div>
                                                        <Label>Role</Label>
                                                        <Input value={member.role} onChange={e => {
                                                            const newT = [...team];
                                                            newT[idx].role = e.target.value;
                                                            setTeam(newT);
                                                        }} placeholder="Role" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Story / Bio</Label>
                                                    <Textarea value={member.story} onChange={e => {
                                                        const newT = [...team];
                                                        newT[idx].story = e.target.value;
                                                        setTeam(newT);
                                                    }} placeholder="Bio..." />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <div className="mt-6">
                                <Button
                                    disabled={saving === 'TEAM'}
                                    onClick={() => handleSave('TEAM', team)}
                                    className={checkChanges('TEAM', team)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'TEAM' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Team
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="wholesale" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Wholesale CTA</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input value={wholesale.title} onChange={e => setWholesale({ ...wholesale, title: e.target.value })} placeholder="Want to buy in Wholesale?" />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea value={wholesale.description} onChange={e => setWholesale({ ...wholesale, description: e.target.value })} placeholder="We supply premium quality..." />
                                </div>
                                <div>
                                    <Label>WhatsApp Number</Label>
                                    <Input value={wholesale.whatsappNumber} onChange={e => setWholesale({ ...wholesale, whatsappNumber: e.target.value })} placeholder="8801..." />
                                </div>
                                <div>
                                    <Label>Mascot Image</Label>
                                    <ImageUpload value={wholesale.image} onChange={url => setWholesale({ ...wholesale, image: url as string })} onRemove={() => setWholesale({ ...wholesale, image: '' })} />
                                </div>
                                <Button
                                    disabled={saving === 'WHOLESALE'}
                                    onClick={() => handleSave('WHOLESALE', wholesale)}
                                    className={checkChanges('WHOLESALE', wholesale)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'WHOLESALE' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Wholesale
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Reviews Section</h3>
                            <div className="space-y-6">
                                <div>
                                    <Label>Featured Story Image</Label>
                                    <ImageUpload value={reviews.featuredImage} onChange={url => setReviews({ ...reviews, featuredImage: url as string })} onRemove={() => setReviews({ ...reviews, featuredImage: '' })} />
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Grid Images (Top 3)</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        {reviews.gridImages?.map((img: any, idx: number) => (
                                            <div key={idx} className="space-y-2">
                                                <ImageUpload value={img.src} onChange={url => {
                                                    const newG = [...reviews.gridImages];
                                                    newG[idx].src = url as string;
                                                    setReviews({ ...reviews, gridImages: newG });
                                                }} onRemove={() => {
                                                    const newG = [...reviews.gridImages];
                                                    newG[idx].src = '';
                                                    setReviews({ ...reviews, gridImages: newG });
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    disabled={saving === 'REVIEWS'}
                                    onClick={() => handleSave('REVIEWS', reviews)}
                                    className={checkChanges('REVIEWS', reviews)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'REVIEWS' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Reviews
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="products" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">Signature Products</h3>
                            <div className="space-y-4">
                                <Label>Select Products to Feature (Click to toggle)</Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-4 border rounded-lg">
                                    {availableProducts.map((p) => {
                                        const isSelected = productsSection.productIds?.includes(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    const currentIds = productsSection.productIds || [];
                                                    const newIds = isSelected
                                                        ? currentIds.filter((id: string) => id !== p.id)
                                                        : [...currentIds, p.id];
                                                    setProductsSection({ ...productsSection, productIds: newIds });
                                                }}
                                                className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${isSelected ? 'border-crab-red bg-red-50 ring-2 ring-crab-red ring-offset-2' : 'border-slate-200 hover:border-crab-red/50'}`}
                                            >
                                                <div className="w-full aspect-square bg-slate-100 rounded-md overflow-hidden">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">No Img</div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-center line-clamp-2">{p.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-slate-500">Selected: {productsSection.productIds?.length || 0} items</p>

                                <div className="pt-4">
                                    <Label>Section Title</Label>
                                    <Input
                                        value={productsSection.title}
                                        onChange={e => setProductsSection({ ...productsSection, title: e.target.value })}
                                        placeholder="Our Signatures"
                                        className="mt-1.5"
                                    />
                                </div>

                                <Button
                                    disabled={saving === 'PRODUCTS'}
                                    onClick={() => handleSave('PRODUCTS', productsSection)}
                                    className={checkChanges('PRODUCTS', productsSection)
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                    }
                                >
                                    {saving === 'PRODUCTS' ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />} Save Products
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Preview Column */}
            <div className="hidden lg:block sticky top-6 h-[calc(100vh-100px)]">
                <div className="relative h-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                    <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs text-white flex items-center gap-2">
                        <Eye className="w-3 h-3 text-green-400" /> Live Preview
                    </div>
                    <div id="story-preview-container" className="h-full overflow-y-auto custom-scrollbar">
                        <StoryLayout
                            data={{
                                hero,
                                values,
                                productsContent: productsSection,
                                gallery,
                                team,
                                wholesale,
                                reviews
                            }}
                            products={availableProducts.filter((p: any) => productsSection.productIds?.includes(p.id))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
