'use client';

import { useMemo, useState } from 'react';
import { saveLabsmailConfig, exportLabsmailLeads } from '@/app/actions/labsmail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, Send, FlaskConical } from 'lucide-react';

type LabsmailConfig = {
    baseUrl: string;
    apiKey: string;
    isActive: boolean;
    lastExportedAt?: string | Date | null;
    error?: string;
};

const rangeOptions = [
    { label: 'All time', value: 'all' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' }
];

export default function LabsmailIntegrationClient({ initialConfig }: { initialConfig: LabsmailConfig }) {
    const [config, setConfig] = useState<LabsmailConfig>({
        baseUrl: initialConfig.baseUrl || '',
        apiKey: initialConfig.apiKey || '',
        isActive: initialConfig.isActive || false,
        lastExportedAt: initialConfig.lastExportedAt || null
    });
    const [originalConfig, setOriginalConfig] = useState(config);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [range, setRange] = useState('all');

    const hasChanges = useMemo(() => {
        return (
            config.baseUrl !== originalConfig.baseUrl ||
            config.apiKey !== originalConfig.apiKey ||
            config.isActive !== originalConfig.isActive
        );
    }, [config, originalConfig]);

    const canExport = config.isActive && config.baseUrl && config.apiKey && !saving && !exporting;

    const handleSave = async () => {
        setSaving(true);
        const res = await saveLabsmailConfig({
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            isActive: config.isActive
        });

        if (res.success) {
            toast.success('LabsMail settings saved.');
            setOriginalConfig({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
                isActive: config.isActive,
                lastExportedAt: config.lastExportedAt || null
            });
        } else {
            toast.error(res.error || 'Failed to save LabsMail settings.');
        }
        setSaving(false);
        return res.success;
    };

    const handleExport = async () => {
        if (hasChanges) {
            const saved = await handleSave();
            if (!saved) return;
        }

        setExporting(true);
        const toastId = toast.loading('Exporting leads to LabsMail...');
        const days = range === 'all' ? undefined : Number(range);

        const res = await exportLabsmailLeads({ days });

        if (res.success) {
            const created = res.results?.created ?? 0;
            const updated = res.results?.updated ?? 0;
            const skipped = res.results?.skipped ?? 0;
            const total = res.totalLeads ?? 0;

            setConfig((prev) => ({
                ...prev,
                lastExportedAt: res.lastExportedAt || prev.lastExportedAt
            }));

            toast.success(`Exported ${total} leads (created: ${created}, updated: ${updated}, skipped: ${skipped}).`, {
                id: toastId
            });
        } else {
            toast.error(res.error || 'Failed to export leads.', { id: toastId });
        }

        setExporting(false);
    };

    const lastExportedLabel = config.lastExportedAt
        ? new Date(config.lastExportedAt).toLocaleString()
        : 'Not exported yet';

    return (
        <div className="space-y-6 max-w-4xl">
            {initialConfig.error ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {initialConfig.error}
                </div>
            ) : null}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-orange-600" /> LabsMail Leads
                    </h1>
                    <p className="text-sm text-slate-500">
                        Send CrabKhai customers to LabsMail for lead management and follow-ups.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="bg-slate-900 hover:bg-orange-600 text-white"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Settings
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">LabsMail Connection</CardTitle>
                    <CardDescription>
                        Paste the base URL and lead ingestion key from your LabsMail admin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="labsmail-base-url">Base URL</Label>
                            <Input
                                id="labsmail-base-url"
                                placeholder="https://labsmail.yourdomain.com"
                                value={config.baseUrl}
                                onChange={(event) => setConfig((prev) => ({ ...prev, baseUrl: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="labsmail-key">Lead Ingestion Key</Label>
                            <Input
                                id="labsmail-key"
                                type="password"
                                placeholder="lm_lead_..."
                                value={config.apiKey}
                                onChange={(event) => setConfig((prev) => ({ ...prev, apiKey: event.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={config.isActive}
                                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, isActive: checked }))}
                            />
                            <span className="text-sm text-slate-600">Enable LabsMail export</span>
                        </div>
                        <span className="text-xs text-slate-500">Last export: {lastExportedLabel}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Export Leads</CardTitle>
                    <CardDescription>
                        Exports customers as leads with name, email, phone, order count, and lifetime spend.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <Label>Export Range</Label>
                            <Select value={range} onValueChange={setRange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rangeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleExport}
                            disabled={!canExport}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Export to LabsMail
                        </Button>
                    </div>
                    <div className="text-xs text-slate-500">
                        Make sure your LabsMail lead key is active. Duplicate emails are updated in LabsMail.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
