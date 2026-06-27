'use client';

import { Settings, Globe, Shield, Truck, ChevronRight, AlertTriangle, Plus, Trash2, LayoutTemplate, CreditCard, Loader2, Save, ArrowLeft, Database, Search, Bold, Italic, Heading, Folder, FolderOpen, X } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { PaymentSettings } from '@/components/admin/PaymentSettings';
import { DeliverySettings } from '@/components/admin/DeliverySettings';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateSiteConfig } from '@/app/actions/settings';
import { ShopGeneralSettings } from '@/components/admin/ShopGeneralSettings';
import { DomainSettings } from '@/components/admin/DomainSettings';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SeoSettings } from '@/components/admin/SeoSettings';
import { SiteConfig } from '@/types/common';

type Certificate = {
    image: string;
    link?: string;
};


function FooterSettings({ initialConfig }: { readonly initialConfig: SiteConfig }) {
    const [config, setConfig] = useState(initialConfig);
    const [originalConfig, setOriginalConfig] = useState(initialConfig);
    const [newCert, setNewCert] = useState({ image: '', link: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Use useMemo to derived state instead of useEffect to avoid "setState in effect" warning
    const hasChanges = useMemo(() => {
        return JSON.stringify(originalConfig) !== JSON.stringify(config);
    }, [config, originalConfig]);


    const addCert = () => {
        if (!newCert.image) return;
        // Ensure certificates is treated as array of objects
        const currentCerts = (Array.isArray(config.certificates) ? config.certificates : []) as Certificate[];
        setConfig({
            ...config,
            certificates: [...currentCerts, { ...newCert }]
        });
        setNewCert({ image: '', link: '' });
    };

    const removeCert = (index: number) => {
        const currentCerts = (Array.isArray(config.certificates) ? config.certificates : []) as Certificate[];
        setConfig({
            ...config,
            certificates: currentCerts.filter((_: Certificate, i: number) => i !== index)
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSiteConfig(config);
        setIsSaving(false);
        if (result.success) {
            toast.success("Footer settings saved!");
            setOriginalConfig(config);
        }
        else toast.error("Failed to save settings.");
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutTemplate className="w-6 h-6 text-purple-600" /> Footer & Trust
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Manage certifications, safety warnings, and footer appearance.</p>
                </div>
                <Button
                    onClick={handleSave}
                    className={hasChanges
                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                    }
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-500" /> Allergen Warning Text
                    </label>
                    <Input
                        value={config.allergensText}
                        onChange={(e) => setConfig({ ...config, allergensText: e.target.value })}
                        placeholder="e.g. Crustaceans, Shellfish"
                    />
                    <p className="text-xs text-slate-400">Displayed in footer warning section.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="text-sm font-medium">Trust Certifications</div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add New Certificate</div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">Certificate Logo</span>
                                    <ImageUpload
                                        value={newCert.image ? [newCert.image] : []}
                                        onChange={(url) => {
                                            const val = Array.isArray(url) ? url[0] : url;
                                            setNewCert({ ...newCert, image: val });
                                        }}
                                        onRemove={() => setNewCert({ ...newCert, image: '' })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">Redirect Link (Optional)</span>
                                    <Input
                                        placeholder="https://..."
                                        value={newCert.link}
                                        onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="pt-5">
                                    <Button onClick={addCert} size="sm" className="bg-slate-800 text-white hover:bg-slate-700">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Certificates</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(Array.isArray(config.certificates) ? config.certificates as Certificate[] : []).map((cert: Certificate, i: number) => (
                                    <div key={cert.link || cert.image || i} className="group relative aspect-square bg-white rounded-lg border-2 border-slate-100 flex flex-col items-center justify-center p-2 hover:border-orange-200 transition-colors">
                                        <div className="flex-1 w-full relative flex items-center justify-center p-2">
                                            <Image src={cert.image} alt="Certificate" fill className="object-contain" />
                                        </div>
                                        {cert.link && (
                                            <div className="w-full text-center border-t border-slate-100 pt-1 mt-1">
                                                <a href={cert.link} target="_blank" className="text-[10px] text-blue-500 hover:underline truncate block w-full px-1">
                                                    {cert.link.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeCert(i)}
                                            className="absolute top-1 right-1 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

function RichTextEditor({ value, onChange, placeholder, limit = 5000 }: { readonly value: string, readonly onChange: (val: string) => void, readonly placeholder: string, readonly limit?: number }) {
    const insert = (syntax: string, close = '') => {
        const textarea = document.getElementById('editor-' + placeholder.replaceAll(/\s+/g, '-')) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + syntax + (selection || 'text') + close + after;
        onChange(newText);

        // Restore focus (timeout needed for React re-render)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + syntax.length, end + syntax.length);
        }, 0);
    };

    const insertColor = (color: string) => {
        insert(`<span style="color: ${color}">`, '</span>');
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b">
                <Button size="sm" variant="ghost" onClick={() => insert('**', '**')} title="Bold" className="h-8 w-8 p-0"><Bold className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => insert('_', '_')} title="Italic" className="h-8 w-8 p-0"><Italic className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => insert('### ')} title="Header" className="h-8 w-8 p-0"><Heading className="w-4 h-4" /></Button>
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <div className="flex items-center gap-1 bg-white rounded border p-0.5">
                    <button onClick={() => insertColor('#f59e0b')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100" title="Gold Text">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    </button>
                    <button onClick={() => insertColor('#ef4444')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100" title="Red Text">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </button>
                    <button onClick={() => insertColor('#e2e8f0')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 bg-slate-900" title="Silver Text">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    </button>
                </div>
            </div>
            <Textarea
                id={'editor-' + placeholder.replaceAll(/\s+/g, '-')}
                value={value}
                onChange={(e) => {
                    if (e.target.value.length <= limit) onChange(e.target.value);
                }}
                className="border-none focus-visible:ring-0 rounded-none min-h-[400px] font-mono text-sm leading-relaxed resize-y p-4"
                placeholder={placeholder}
            />
            <div className="p-2 text-xs flex justify-between items-center text-slate-400 bg-slate-50 border-t">
                <span>Supports Markdown & HTML Colors</span>
                <span className={value.length > limit * 0.9 ? "text-red-500 font-bold" : ""}>
                    {value.length} / {limit} chars
                </span>
            </div>
        </div>
    )
}

function PolicySettings() {
    const [config, setConfig] = useState<Partial<SiteConfig>>({
        contactPhone: '',
        contactEmail: '',
        contactAddress: '',
        allergensText: '',
        certificates: [] as Certificate[]
    });
    const [originalConfig, setOriginalConfig] = useState<Partial<SiteConfig>>({
        contactPhone: '',
        contactEmail: '',
        contactAddress: '',
        allergensText: '',
        certificates: [] as Certificate[]
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        const isDifferent = JSON.stringify(originalConfig) !== JSON.stringify(config);
        setHasChanges(isDifferent);
    }, [config, originalConfig]);

    const loadConfig = async () => {
        setIsLoading(true);
        const { getSiteConfig } = await import('@/app/actions/settings');
        const res = await getSiteConfig();
        if (res) {
            // Default policies if empty
            if (!res.privacyPolicy) {
                res.privacyPolicy = `**Your Privacy Matters to Us**

At **Crab Khai**, we believe building trust is just as important as delivering premium seafood. We want to be transparent about how we handle your information.

**What We Collect & Why**
When you place an order, we ask for your name, phone number, and delivery address. This isn't just data to us—it's the bridge that allows us to deliver fresh, quality products directly to your kitchen.

**Our Promise**
Your personal details are used strictly to fulfill your orders and improve your experience with us. We do not sell, trade, or share your information with outside parties. You are our valued customer, and your privacy is preserved with the highest standards of security.

**Always Here for You**
If you have any questions about your data or just want to verify details, please don't hesitate to contact us directly at ${res.contactEmail || 'support@crabkhai.com'}.`;
            }
            if (!res.refundPolicy) {
                res.refundPolicy = `**Our Freshness Guarantee**

We take immense pride in the quality of our seafood. If something isn't right, we want to know.

**Spoilage & Quality Issues**
In the unlikely event that you receive a product that doesn't meet our premium standards (e.g., spoiled or damaged), please inform us within **24 hours** of delivery. A quick photo helps us resolve this instantly.

**Hassle-Free Refunds**
For valid claims, we process refunds directly to your original payment method (or bKash/Nagad) within **5-7 business days**. We aim to resolve every issue with fairness and speed.

*Note: Due to the perishable nature of our products, we cannot accept returns for items that have been cooked or consumed.*`;
            }
            const safeConfig: SiteConfig = {
                ...res,
                privacyPolicy: res.privacyPolicy ?? undefined,
                refundPolicy: res.refundPolicy ?? undefined,
                termsPolicy: res.termsPolicy ?? undefined,
                certificates: Array.isArray(res.certificates) ? (res.certificates as unknown as Certificate[]) : []
            };
            setConfig(safeConfig);
            setOriginalConfig(safeConfig);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { updateSiteConfig } = await import('@/app/actions/settings');
        const result = await updateSiteConfig(config as SiteConfig);
        setIsSaving(false);
        if (result.success) {
            toast.success("Policies saved successfully!");
            setOriginalConfig(config);
            setHasChanges(false);
        } else {
            toast.error("Failed to save policies.");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-green-600" /> Policies & Terms
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Manage transparency: Privacy, Refunds, and Terms of Service.</p>
                </div>
                <Button
                    onClick={handleSave}
                    className={hasChanges
                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                    }
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                        Privacy Policy
                    </div>
                    <RichTextEditor
                        value={config.privacyPolicy || ''}
                        onChange={(val) => setConfig({ ...config, privacyPolicy: val })}
                        placeholder="Privacy Policy Content"
                        limit={8000}
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                        Refund Policy
                    </div>
                    <RichTextEditor
                        value={config.refundPolicy || ''}
                        onChange={(val) => setConfig({ ...config, refundPolicy: val })}
                        placeholder="Refund Policy Content"
                        limit={8000}
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                        Terms & Conditions
                    </div>
                    <RichTextEditor
                        value={config.termsPolicy || ''}
                        onChange={(val) => setConfig({ ...config, termsPolicy: val })}
                        placeholder="Terms of Service..."
                        limit={10000}
                    />
                </div>
            </div>
        </div>
    );
}

import { useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';


function FolderPicker({
    isOpen,
    onClose,
    onSelect
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
}) {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<{ name: string, path: string, type: string, details?: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadPath(''); // Load drives initially
            setHistory([]);
        }
    }, [isOpen]);

    const loadPath = async (path: string) => {
        setUploading(true);
        try {
            const { listDirectories } = await import('@/app/actions/explorer');
            const res = await listDirectories(path);
            if (res.success && res.items) {
                setItems(res.items);
                setCurrentPath(path);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load directory");
        } finally {
            setUploading(false);
        }
    };

    const handleNavigate = (path: string) => {
        setHistory(prev => [...prev, currentPath]);
        loadPath(path);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const prev = history.at(-1);
        if (!prev) return;
        setHistory(prevHist => prevHist.slice(0, -1));
        loadPath(prev);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed -inset-px z-[60000] flex items-center justify-center bg-black/80 p-4 font-sans backdrop-blur-lg backdrop-brightness-50">
            <Card className="w-full max-w-xl h-[500px] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200 ring-1 ring-slate-200 bg-white">
                <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800">
                        <FolderOpen className="w-5 h-5 text-blue-600" /> Select Backup Folder
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                <div className="p-2 border-b flex items-center gap-2 bg-white">
                    <Button variant="ghost" size="sm" onClick={handleBack} disabled={!currentPath}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded flex-1 truncate text-slate-700">
                        {currentPath || 'This PC'}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-white">
                    {(() => {
                        if (uploading) {
                            return (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            );
                        }
                        if (items.length === 0) {
                            return (
                                <div className="text-center text-slate-400 mt-20">Folder is empty</div>
                            );
                        }
                        return (
                            <div className="grid grid-cols-1 gap-1">
                                {items.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigate(item.path)}
                                        className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-md text-left group transition-colors border border-transparent hover:border-blue-100"
                                    >
                                        {item.type === 'drive' ? (
                                            <Database className="w-6 h-6 text-slate-400 group-hover:text-blue-500 shrink-0" />
                                        ) : (
                                            <Folder className="w-6 h-6 text-yellow-500 group-hover:text-yellow-600 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700">{item.name}</div>
                                            {item.details && (
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{item.details}</div>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (!currentPath) {
                                toast.error("Please select a valid folder, not the root.");
                                return;
                            }
                            onSelect(currentPath);
                            onClose();
                        }}
                        disabled={!currentPath}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Select This Folder
                    </Button>
                </div>
            </Card>
        </div>,
        document.body
    );
}

function BackupSettings() {
    const [backupPath, setBackupPath] = useState('');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backups, setBackups] = useState<string[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    // Load persisted path on mount
    useEffect(() => {
        const savedPath = localStorage.getItem('backupPath');
        if (savedPath) {
            setBackupPath(savedPath);
        }
    }, []);

    const loadBackups = useCallback(async () => {
        if (!backupPath) return; // Don't try loading from empty path
        const { listBackups } = await import('@/app/actions/backup');
        const res = await listBackups(backupPath);
        if (res.success && res.backups) {
            setBackups(res.backups);
        } else {
            setBackups([]);
        }
    }, [backupPath]);

    // Load backups when path changes
    useEffect(() => {
        if (!backupPath) {
            setBackups([]); // Clear backups if path is empty
            return;
        }
        loadBackups();
    }, [backupPath, loadBackups]);

    const handleBackup = async () => {
        if (!backupPath) {
            toast.error("Please enter a backup folder path.");
            return;
        }

        // Persist path
        localStorage.setItem('backupPath', backupPath);

        setIsBackingUp(true);
        const path = backupPath;

        toast.promise(
            (async () => {
                const { performBackup } = await import('@/app/actions/backup');
                const res = await performBackup(path);
                if (!res.success) throw new Error(res.message);
                loadBackups(); // Refresh list
                return res.message;
            })(),
            {
                loading: 'Backing up database...',
                success: (msg) => `${msg}`,
                error: (err) => `Backup failed: ${err.message}`,
                finally: () => setIsBackingUp(false)
            }
        );
    };

    const handleRestore = async (folderName: string) => {
        if (!confirm(`⚠️ DANGER: Are you sure you want to restore from ${folderName}?\n\nThis will DELETE CURRENT DATA and replace it with the backup. This cannot be undone.`)) {
            return;
        }

        setIsRestoring(true);
        const fullPath = `${backupPath}\\${folderName}`;

        toast.promise(
            (async () => {
                const { performRestore } = await import('@/app/actions/backup');
                const res = await performRestore(fullPath);
                if (!res.success) throw new Error(res.message);
                return res.message;
            })(),
            {
                loading: 'Restoring database... (Please wait)',
                success: (msg) => `${msg} - Please refresh page.`,
                error: (err) => `Restore failed: ${err.message}`,
                finally: () => setIsRestoring(false)
            }
        );
    };

    const handlePathSelect = (path: string) => {
        setBackupPath(path);
        localStorage.setItem('backupPath', path);
        setShowPicker(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <FolderPicker
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handlePathSelect}
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="w-6 h-6 text-blue-600" /> Backup & Restore
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Create local backups or restore from previous points.</p>
                </div>
            </div>

            <div className="space-y-4">
                <Card className="p-6">
                    <h3 className="font-bold mb-4">Create New Backup</h3>
                    <div className="space-y-2">
                        <label htmlFor="backup-path-input" className="text-sm font-medium">Local Backup Path</label>
                        <div className="flex gap-2">
                            <Input
                                id="backup-path-input"
                                value={backupPath}
                                onChange={(e) => setBackupPath(e.target.value)}
                                placeholder="Select a folder..."
                                className="bg-white font-mono text-sm"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => setShowPicker(true)}
                                title="Browse Folder"
                            >
                                <FolderOpen className="w-4 h-4 mr-2" /> Browse
                            </Button>
                            <Button
                                onClick={handleBackup}
                                disabled={isBackingUp || isRestoring}
                                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                                {isBackingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Backup Now
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Files will be saved to: <code>{backupPath || '...'}\&lt;timestamp&gt;\Table.json</code>
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Available Restore Points</h3>
                        <Button variant="ghost" size="sm" onClick={loadBackups} title="Refresh List">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>

                    {backups.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                            No backups found in this folder.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {backups.map((folder) => (
                                <div key={folder} className="flex justify-between items-center p-3 bg-white border rounded-lg hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium font-mono text-sm">{folder}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isRestoring || isBackingUp}
                                        onClick={() => handleRestore(folder)}
                                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-100"
                                    >
                                        {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="flex items-center gap-1"><span className="text-xs">Restore</span></div>}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {children}
    </Card>
);

export function ShopClient({ initialConfig }: { readonly initialConfig: SiteConfig }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeModule = searchParams.get('tab');

    const handleModuleSelect = (moduleId: string) => {
        router.push(`/admin/shop?tab=${moduleId}`);
    };

    const handleBack = () => {
        router.push('/admin/shop');
    };

    const modules = [
        { id: 'general', label: 'General Information', icon: Settings, desc: 'Store Name, Address, Contacts' },
        { id: 'seo', label: 'Search & Social', icon: Search, desc: 'SEO Meta, OpenGraph, Twitter Cards' },
        { id: 'footer', label: 'Footer & Trust', icon: LayoutTemplate, desc: 'Certifications, Allergens, Warnings' },
        { id: 'payment', label: 'Payment Gateways', icon: CreditCard, desc: 'bKash, COD, Manual MFS, Advance' },
        { id: 'backup', label: 'Database Backup', icon: Database, desc: 'Backup database to local disk' },
        { id: 'domain', label: 'Shop Domain', icon: Globe, desc: 'Connect custom domain (Pro Only)' },
        { id: 'policy', label: 'Policies & Terms', icon: Shield, desc: 'Refund, Privacy & Terms' },
        { id: 'shipping', label: 'Delivery Settings', icon: Truck, desc: 'Shipping zones & fees' },
    ];

    const renderModuleContent = () => {
        if (!activeModule) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((item) => (
                        <Card
                            key={item.id}
                            onClick={() => handleModuleSelect(item.id)}
                            className="relative overflow-hidden group hover:shadow-lg transition-shadow border-gray-100 cursor-pointer bg-white"
                        >
                            <div className="p-6 flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-800">{item.label}</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                        </Card>
                    ))}
                </div>
            );
        }

        switch (activeModule) {
            case 'general': return <Wrapper><ShopGeneralSettings initialConfig={initialConfig} /></Wrapper>;
            case 'seo': return <Wrapper><SeoSettings initialConfig={initialConfig} /></Wrapper>;
            case 'footer': return <Wrapper><FooterSettings initialConfig={initialConfig} /></Wrapper>;
            case 'payment': return <Wrapper><PaymentSettings /></Wrapper>;
            case 'backup': return <Wrapper><BackupSettings /></Wrapper>;
            case 'domain': return <Wrapper><DomainSettings /></Wrapper>;
            case 'policy': return <Wrapper><PolicySettings /></Wrapper>;
            case 'shipping': return <Wrapper><DeliverySettings /></Wrapper>;
            default:
                return (
                    <Card className="p-12 text-center animate-in fade-in zoom-in-95">
                        <div className="text-4xl mb-4">🚧</div>
                        <h2 className="text-xl font-bold text-slate-800">Work in Progress</h2>
                        <p className="text-slate-500 mb-6">This module is coming soon.</p>
                        <Button onClick={handleBack}>Go Back</Button>
                    </Card>
                );
        }
    };


    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                {activeModule && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBack}
                        className="group h-10 w-10 shrink-0 rounded-full border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 hover:bg-white transition-all duration-500 animate-in fade-in slide-in-from-right-8 zoom-in-90"
                        title="Back to Menu"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-orange-600 group-hover:-translate-x-1 transition-transform duration-300" />
                    </Button>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Manage Shop</h1>
                    <p className="text-sm text-slate-500">Configure your store identity and operations.</p>
                </div>
            </div>

            {renderModuleContent()}
        </div>
    );
}
