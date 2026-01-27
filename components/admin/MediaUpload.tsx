'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MediaUploadProps {
    value?: string;
    values?: string[]; // For multiple mode
    onChange?: (url: string) => void;
    onValuesChange?: (urls: string[]) => void; // For multiple mode
    onRemove: (url?: string) => void; // Modified to accept url for specific removal in multiple mode
    className?: string;
    multiple?: boolean;
}

export function MediaUpload({
    value,
    values = [],
    onChange,
    onValuesChange,
    onRemove,
    className,
    multiple = false
}: MediaUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File): Promise<string | null> => {
        // Check if Cloudinary is configured
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        // Helper for fallback
        const getLocalFallback = (): Promise<string> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(file);
            });
        };

        if (!cloudName || !uploadPreset) {
            const localUrl = await getLocalFallback();
            toast.success("Saved locally (Cloudinary config invalid)");
            return localUrl;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        // Forced image type since video is removed
        const resourceType = 'image';

        try {
            console.log("Attempting Cloudinary upload...", { cloudName: cloudName ? 'Present' : 'Missing', uploadPreset: uploadPreset ? 'Present' : 'Missing' });

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Cloudinary Error (${response.status}): ${errText}`);
            }

            const data = await response.json();

            if (data.secure_url) {
                return data.secure_url;
            } else {
                console.error("Cloudinary Error:", data.error);
                return await getLocalFallback();
            }
        } catch (error) {
            console.error("Upload Failed (Falling back to local):", error);
            // toast.error(`Upload error: ${(error as any).message}`); // Optional: don't annoy user if fallback works
            return await getLocalFallback();
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setIsUploading(true);
        let newUrls: string[] = [];

        try {
            const promises = acceptedFiles.map(file => uploadFile(file));
            const results = await Promise.all(promises);
            newUrls = results.filter((url): url is string => url !== null);

            if (newUrls.length > 0) {
                if (multiple && onValuesChange) {
                    onValuesChange([...values, ...newUrls]);
                    toast.success(`${newUrls.length} file(s) uploaded!`);
                } else if (onChange) {
                    onChange(newUrls[0]);
                    toast.success("Media uploaded successfully!");
                }
            }
        } catch (error) {
            console.error("Upload process failed", error);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    }, [multiple, onChange, onValuesChange, values]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: multiple ? 0 : 1, // 0 means unlimited
        disabled: isUploading
    });

    // SINGLE MODE RENDER
    if (!multiple) {
        return (
            <div className={cn("w-full space-y-4", className)}>
                {value ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 group bg-slate-950">
                        <img src={value} alt="Upload" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-2 right-2 z-10">
                            <Button onClick={(e) => { e.preventDefault(); onRemove(); }} size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div {...getRootProps()} className={cn("relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer hover:bg-slate-50/50", isDragActive ? "border-orange-500 bg-orange-50/50" : "border-slate-200", isUploading && "opacity-50 pointer-events-none")}>
                        <input {...getInputProps()} />
                        <div className={cn("p-4 rounded-full bg-slate-50 transition-colors", isDragActive && "bg-orange-100")}>
                            {isUploading ? <Loader2 className="w-8 h-8 text-orange-600 animate-spin" /> : <div className="relative"><ImageIcon className={cn("w-8 h-8 text-slate-400", isDragActive && "text-orange-600")} /></div>}
                        </div>
                        <div className="text-center space-y-1 mt-2">
                            <p className="text-sm font-medium text-slate-700">{isDragActive ? "Drop media here" : "Click or drag image"}</p>
                            <p className="text-xs text-slate-400">Max 10MB</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // MULTIPLE MODE RENDER
    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {values.map((url, index) => {
                    return (
                        <div key={index} className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 group bg-slate-100">
                            <img src={url} alt={`Gallery ${index}`} className="h-full w-full object-cover" />
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button onClick={(e) => { e.preventDefault(); onRemove(url); }} size="icon" variant="destructive" className="h-6 w-6 rounded-full">
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {/* Upload Button Block */}
                <div {...getRootProps()} className={cn("aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg transition-all cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-orange-600 hover:border-orange-200", isDragActive && "border-orange-500 bg-orange-50", isUploading && "opacity-50 pointer-events-none")}>
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <PlusIcon className="w-8 h-8" />
                    )}
                    <span className="text-xs font-medium">Add Image</span>
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
