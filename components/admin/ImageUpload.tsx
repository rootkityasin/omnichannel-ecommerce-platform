'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { uploadToCloudinary } from '@/app/actions/upload';

interface ImageUploadProps {
    value?: string | string[];
    onChange: (url: string | string[]) => void;
    onRemove: (url?: string) => void;

    // Config
    multiple?: boolean;
    maxSize?: number; // MB
    recommendedText?: string;
    className?: string;
    disabled?: boolean;
}

export function ImageUpload({
    value = [],
    onChange,
    onRemove,
    multiple = false,
    maxSize = 5,
    recommendedText = "1000x1000 (1:1 Aspect Ratio)",
    className,
    disabled = false
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    // Normalize value to array for consistent rendering
    const valuesArray = Array.isArray(value) ? value : (value ? [value] : []);

    // --- WEBP CONVERSION ---
    const convertToWebP = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas context not available"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp'
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error("WebP conversion failed"));
                    }
                }, 'image/webp', 0.8); // 0.8 quality
            };
            img.onerror = (err) => reject(err);
            img.src = URL.createObjectURL(file);
        });
    };

    const uploadFile = async (originalFile: File): Promise<string | null> => {
        try {
            // Convert to WebP (Client-side optimization before upload)
            const file = await convertToWebP(originalFile);

            const formData = new FormData();
            formData.append('file', file);

            // Use Server Action for secure upload
            const result = await uploadToCloudinary(formData);

            if (!result.success) {
                throw new Error(result.error || "Upload failed");
            }

            return result.url as string;
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error(`Upload failed: ${String(error)}`);
            // Fallback to local base64 if upload fails (optional, good for offline dev)
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(originalFile);
            });
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = acceptedFiles.map(uploadFile);
            const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];

            if (uploadedUrls.length > 0) {
                if (multiple) {
                    // Append new URLs to existing ones
                    const newValue = [...valuesArray, ...uploadedUrls];
                    onChange(newValue);
                    toast.success("Files uploaded successfully");
                } else {
                    // Replace with the first new URL
                    onChange(uploadedUrls[0]);
                    toast.success("Image uploaded successfully");
                }
            }
        } catch (err) {
            toast.error("Upload stopped due to an error");
        } finally {
            setIsUploading(false);
        }
    }, [multiple, onChange, valuesArray]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxSize: maxSize * 1024 * 1024,
        maxFiles: multiple ? 0 : 1,
        disabled: isUploading || disabled,
        onDropRejected: (rejections) => {
            const error = rejections[0]?.errors[0];
            if (error?.code === 'file-too-large') {
                toast.error(`File is too large. Max size is ${maxSize}MB`);
            } else {
                toast.error(error?.message || "File rejected");
            }
        }
    });

    return (
        <div className={cn("w-full space-y-4", className)}>

            {/* Grid for uploaded images */}
            {valuesArray.length > 0 && (
                <div className={cn("grid gap-4", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                    {valuesArray.map((url, index) => (
                        <div key={index} className={cn("relative overflow-hidden rounded-lg border border-slate-200 group bg-slate-100", multiple ? "aspect-square" : "aspect-video")}>
                            <img src={url} alt="Uploaded" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-2 right-2">
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // For multiple, we usually need the specific URL or index. 
                                        // But logic depends on parent. We pass URL for convenience.
                                        onRemove(url);
                                    }}
                                    size="icon"
                                    variant="destructive"
                                    type="button"
                                    className="h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* For Multiple: Show "Add More" box if needed (optional style) */}
                    {multiple && (
                        <div
                            {...getRootProps()}
                            className={cn(
                                "aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg transition-all cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-orange-600 hover:border-orange-200",
                                isDragActive && "border-orange-500 bg-orange-50",
                                (isUploading || disabled) && "opacity-50 pointer-events-none"
                            )}
                        >
                            <input {...getInputProps()} />
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-8 h-8" />}
                            <span className="text-xs font-medium">Add Image</span>
                        </div>
                    )}
                </div>
            )}

            {/* Dropzone for Single (if empty) or just Hidden if Multiple (already handled above in grid) */}
            {/* Wait, if Multiple and not empty, we showed the "Add" card in the grid. */}
            {/* If Single and NOT empty, we showed the image preview above. */}
            {/* So we only show this main dropzone if: (Single AND Empty) OR (Multiple AND Empty) */}

            {valuesArray.length === 0 && (
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer hover:bg-slate-50/50",
                        isDragActive ? "border-orange-500 bg-orange-50/50" : "border-slate-200",
                        (isUploading || disabled) && "opacity-50 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className={cn("p-4 rounded-full bg-slate-50 transition-colors", isDragActive && "bg-orange-100")}>
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                        ) : (
                            <UploadCloud className={cn("w-8 h-8 text-slate-400", isDragActive && "text-orange-600")} />
                        )}
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-slate-700">
                            {isDragActive ? "Drop files here" : `Click or drag ${multiple ? 'files' : 'image'} to upload`}
                        </p>
                        <p className="text-xs text-slate-400">
                            Recommended: {recommendedText} (Max {maxSize}MB)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
