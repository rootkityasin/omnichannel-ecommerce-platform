'use client';

import { Flame, Activity } from 'lucide-react';

export function ProductInfo() {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-heading font-bold text-slate-800 mb-4">Product Information</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        We prioritize transparency and quality. Here is everything you need to know about our Soft Shell Crabs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Cooking/Storage Instructions */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <Flame className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Cooking & Storage</h3>
                                <p className="text-sm text-slate-500">How to prepare your crab</p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border">
                            <img
                                src="/product-info/cooking-instructions.jpg"
                                alt="Cooking and Storage Instructions"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="bg-white p-3 rounded-lg border">
                                <strong className="block text-slate-800 mb-1">Fry</strong>
                                5-6 mins
                            </div>
                            <div className="bg-white p-3 rounded-lg border">
                                <strong className="block text-slate-800 mb-1">Oven Bake</strong>
                                10-12 mins
                            </div>
                        </div>
                    </div>

                    {/* Nutritional Info */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Nutritional Facts</h3>
                                <p className="text-sm text-slate-500">Values per 100g</p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border">
                            <img
                                src="/product-info/nutrition-info.jpg"
                                alt="Nutritional Values"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="bg-white p-3 rounded-lg border">
                                <strong className="block text-slate-800 mb-1">Protein</strong>
                                9.38 g
                            </div>
                            <div className="bg-white p-3 rounded-lg border">
                                <strong className="block text-slate-800 mb-1">Energy</strong>
                                125 Calories
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
