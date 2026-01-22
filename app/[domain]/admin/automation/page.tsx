'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Printer, Bell, Box, MessageSquare } from 'lucide-react';

export default function AutomationPage() {
    const [config, setConfig] = useState({
        print: false,
        sound: true,
        inventory: true,
        sms: false
    });

    const toggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">⚙️ Automation Rules</h1>
                <p className="text-sm text-slate-500">Configure how your kitchen runs on auto-pilot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Kitchen Printer */}
                <Card className={`border-gray-100 shadow-sm border-l-4 transition-colors ${config.print ? 'border-l-orange-500 bg-orange-50/10' : 'border-l-gray-300'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Printer className={`w-5 h-5 ${config.print ? 'text-orange-600' : 'text-gray-400'}`} /> Auto-Print Receipts
                        </CardTitle>
                        <Switch checked={config.print} onCheckedChange={() => toggle('print')} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-4">Automatically print a Kitchen Order Ticket (KOT) as soon as an order is <strong>Confirmed</strong>.</p>
                        <div className="bg-gray-50 p-3 rounded text-xs font-mono text-slate-600 border border-gray-100">
                            Printer Status: <span className={config.print ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                {config.print ? 'Ready to Print' : 'Disabled'}
                            </span>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 w-full" disabled={!config.print}>Connect Thermal Printer (USB)</Button>
                    </CardContent>
                </Card>

                {/* Live Sound */}
                <Card className={`border-gray-100 shadow-sm border-l-4 transition-colors ${config.sound ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-gray-300'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Bell className={`w-5 h-5 ${config.sound ? 'text-blue-600' : 'text-gray-400'}`} /> New Order Sound
                        </CardTitle>
                        <Switch checked={config.sound} onCheckedChange={() => toggle('sound')} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-4">Play a loud notification sound continuously until a new order is accepted.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => alert('🔊 Playing Sound!')} disabled={!config.sound}>Test Sound 🔊</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Smart Inventory */}
                <Card className={`border-gray-100 shadow-sm border-l-4 transition-colors ${config.inventory ? 'border-l-green-500 bg-green-50/10' : 'border-l-gray-300'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Box className={`w-5 h-5 ${config.inventory ? 'text-green-600' : 'text-gray-400'}`} /> Smart Inventory
                        </CardTitle>
                        <Switch checked={config.inventory} onCheckedChange={() => toggle('inventory')} />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm text-slate-600">Decrement on Order</span>
                                <span className={`text-xs font-bold ${config.inventory ? 'text-green-600' : 'text-gray-400'}`}>
                                    {config.inventory ? 'Active' : 'Off'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm text-slate-600">Low Stock Alert (SMS)</span>
                                <span className={`text-xs font-bold ${config.inventory ? 'text-green-600' : 'text-gray-400'}`}>
                                    {config.inventory ? 'Active (Below 5)' : 'Off'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Engagement */}
                <Card className={`border-gray-100 shadow-sm border-l-4 transition-colors ${config.sms ? 'border-l-purple-500 bg-purple-50/10' : 'border-l-gray-300'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className={`w-5 h-5 ${config.sms ? 'text-purple-600' : 'text-gray-400'}`} /> Auto-Confirm (SMS)
                        </CardTitle>
                        <Switch checked={config.sms} onCheckedChange={() => toggle('sms')} />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-4">Send an automated SMS to the customer when you accept the order.</p>
                        <Button variant="outline" size="sm" className="w-full" disabled={!config.sms}>Configure Gateway</Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
