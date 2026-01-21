'use client';

import { useState, useEffect } from 'react';
import { getAdminReviews, deleteReview } from '@/app/actions/review';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trash2, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        const data = await getAdminReviews();
        setReviews(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        const res = await deleteReview(id);
        if (res.success) {
            toast.success("Review deleted");
            setReviews(reviews.filter(r => r.id !== id));
        } else {
            toast.error("Failed to delete review");
        }
    };

    const getStarArray = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ));
    };

    if (loading) return <div className="p-8">Loading reviews...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Reviews & Feedback</h1>
                    <p className="text-sm text-slate-500">Manage customer reviews and ratings.</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Reviews</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No reviews found yet.</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} className="p-6 relative group border-slate-200">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(review.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">{getStarArray(review.rating)}</div>
                                        <span className="text-sm font-bold ml-2">{review.rating}.0</span>
                                        <span className="text-xs text-slate-400">• {format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                                    </div>

                                    <p className="text-slate-700 mb-4 italic">"{review.comment || 'No comment provided'}"</p>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                                                {review.user?.name?.[0] || 'U'}
                                            </div>
                                            <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                                            <span className="text-slate-400 text-xs">({review.user?.phone || 'No phone'})</span>
                                        </div>

                                        {review.product && (
                                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                Product: {review.product.name}
                                            </Badge>
                                        )}
                                        {!review.product && (
                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                                General Feedback
                                            </Badge>
                                        )}
                                    </div>

                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-4">
                                            {review.images.map((img: string, i: number) => (
                                                <img key={i} src={img} alt="User review" className="w-16 h-16 rounded object-cover border border-slate-200" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
