import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

// Matches the palette used in SocialHubView so the widget feels native to the app.
const WIDGET_PALETTE = {
    window: "#0A0A0A",
    windowBorder: "#90A0B3",
    tabIcon: "#0E73F6",
    menuIcons: "#5A616A",
    textDark: "#000000",
    textLight: "#FFFFFF",
    link: "#0E73F6",
    action: "#FF620C",
    inactiveTabIcon: "#0E2F5A",
    error: "#F44235",
    inProgress: "#0078FF",
    complete: "#20B832",
    sourceBg: "#E4EBF1",
};

interface TaskImageUploaderProps {
    images: string[];
    /** Called once per successfully uploaded image. Use a functional state update in the parent. */
    onAdd: (url: string) => void;
    onRemove: (index: number) => void;
}

export function TaskImageUploader({ images, onAdd, onRemove }: TaskImageUploaderProps) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider">
                <ImageIcon size={14} /> Images
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {images.map((url, i) => (
                        <div
                            key={`${url}-${i}`}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/30"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Attachment ${i + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <button
                                type="button"
                                onClick={() => onRemove(i)}
                                className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "social_hub_default"}
                onSuccess={(result: CloudinaryUploadWidgetResults) => {
                    const info = result?.info;
                    if (info && typeof info !== "string" && info.secure_url) {
                        onAdd(info.secure_url);
                    }
                }}
                options={{
                    sources: ["local", "url", "camera"],
                    multiple: true,
                    styles: { palette: WIDGET_PALETTE },
                }}
            >
                {({ open }) => (
                    <button
                        type="button"
                        onClick={() => open()}
                        className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all"
                    >
                        <Upload size={20} className="mb-1.5" />
                        <span className="text-sm font-medium">Upload Image</span>
                    </button>
                )}
            </CldUploadWidget>
        </div>
    );
}
