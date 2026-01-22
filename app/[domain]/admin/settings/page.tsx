'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/components/providers/AdminProvider';

// Default values to mock "fetching"
const initialConfig = {
    contactPhone: "+880 1804 221 161",
    contactEmail: "crabkhaibangladesh@gmail.com",
    contactAddress: "195 Green Road, Dhaka",
    allergensText: "Crustaceans",
    certificates: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/HACCP_Certification_Mark.svg/1200px-HACCP_Certification_Mark.svg.png",
        "https://www.qualityaustria.com/fileadmin/_processed_/c/9/csm_GMP_Good_Manufacturing_Practice_Logo_3502845680.jpg",
    ]
};

export default function SettingsPage() {
    const { settings, updateSettings } = useAdmin();
    // Local state for the "edit buffer" to avoid re-renders on every keystroke if desired, 
    // but for simplicity we can sync one-way or just use local buffer.
    // Let's use a local buffer `config` initialized from `settings` to allow "Save" behavior.
    // Let's use a local buffer `config` initialized from `settings` to allow "Save" behavior.
    const [config, setConfig] = useState(settings);
    const [originalConfig, setOriginalConfig] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local config when provider settings change (e.g. initial load)
    useEffect(() => {
        // Only update if no local changes yet or just initialization
        if (!hasChanges) {
            setConfig(settings);
            setOriginalConfig(settings);
        }
    }, [settings, hasChanges]);

    // Comparison effect
    useEffect(() => {
        if (!originalConfig) return;
        const isDifferent = JSON.stringify(originalConfig) !== JSON.stringify(config);
        setHasChanges(isDifferent);
    }, [config, originalConfig]);

    const [newCert, setNewCert] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [backupPath, setBackupPath] = useState('G:\\crabkhai\\backup');

    const handleSave = () => {
        setIsSaving(true);
        updateSettings(config);
        setTimeout(() => {
            setIsSaving(false);
            setOriginalConfig(config);
            setHasChanges(false);
            toast.success("Settings updated successfully!");
        }, 800);
    };

    const addCert = () => {
        if (!newCert) return;
        setConfig({ ...config, certificates: [...config.certificates, newCert] });
        setNewCert('');
    };

    const removeCert = (index: number) => {
        setConfig({ ...config, certificates: config.certificates.filter((_, i) => i !== index) });
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Site Settings</h1>
                    <p className="text-sm text-slate-500">Manage global website information.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={hasChanges
                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                    }
                >
                    {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Contact Information */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-orange-500 rounded-full" />
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={config.contactPhone}
                                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                value={config.contactEmail}
                                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                            />
                        </div>
                        <div className="col-span-full space-y-2">
                            <Label>Physical Address</Label>
                            <Textarea
                                value={config.contactAddress}
                                onChange={(e) => setConfig({ ...config, contactAddress: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>

                {/* Consumer Advisory */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-red-500 rounded-full" />
                        Allergen & Safety Warning
                    </h2>
                    <div className="space-y-2">
                        <Label>Allergens List (Displayed in footer warning)</Label>
                        <Input
                            value={config.allergensText}
                            onChange={(e) => setConfig({ ...config, allergensText: e.target.value })}
                            placeholder="e.g. Crustaceans, Shellfish"
                        />
                    </div>
                </Card>

                {/* Database Backup */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full" />
                        Database Backup
                    </h2>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Local Backup Path</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={backupPath}
                                    onChange={(e) => setBackupPath(e.target.value)}
                                    placeholder="e.g. G:\crabkhai\backup"
                                />
                                <Button
                                    onClick={async () => {
                                        const path = backupPath || 'G:\\crabkhai\\backup';
                                        toast.promise(
                                            (async () => {
                                                const { performBackup } = await import('@/app/actions/backup');
                                                const res = await performBackup(path);
                                                if (!res.success) throw new Error(res.message);
                                                return res.message;
                                            })(),
                                            {
                                                loading: 'Backing up database...',
                                                success: (msg) => `${msg}`,
                                                error: (err) => `Backup failed: ${err.message}`
                                            }
                                        );
                                    }}
                                    variant="outline"
                                    className="whitespace-nowrap"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Backup Now
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500">
                                Enter a local folder path where you want to save the database backup.
                                A new timestamped folder will be created inside.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Certifications */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full" />
                            Certifications & Trust Badges
                        </h2>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <Input
                            placeholder="Paste image URL (png/jpg)..."
                            value={newCert}
                            onChange={(e) => setNewCert(e.target.value)}
                        />
                        <Button onClick={addCert} variant="outline">
                            <Plus className="w-4 h-4" /> Add
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {config.certificates.map((cert, i) => (
                            <div key={i} className="group relative aspect-square bg-slate-50 rounded-lg border flex items-center justify-center p-4">
                                <img src={cert} alt={`Cert ${i}`} className="w-full h-full object-contain" />
                                <button
                                    onClick={() => removeCert(i)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
