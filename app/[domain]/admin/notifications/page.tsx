
import { getNotifications, clearNotifications } from '@/app/actions/notification';
import { format } from 'date-fns';
import { Check, Trash2, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NotificationsPage() {
    const notifications = await getNotifications(50);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-600" />
                        Notification History
                    </h1>
                    <p className="text-slate-500 mt-1">View past alerts and activity logs.</p>
                </div>
                <form action={async () => {
                    'use server';
                    await clearNotifications();
                }}>
                    <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All History
                    </Button>
                </form>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card className="bg-slate-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                <Bell className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No notifications found</h3>
                            <p className="text-slate-500">Your notification history is clean.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n: any) => (
                        <Card key={n.id} className={`transition-colors ${!n.read ? 'bg-blue-50/30 border-blue-100' : 'hover:bg-slate-50'}`}>
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-base font-medium ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(n.createdAt), 'MMM d, yyyy h:mm a')}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {n.message}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
