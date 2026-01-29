'use server';

export async function uploadToCloudinary(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Access environment variables securely on the server
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim();
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/g, '').trim();

        if (!cloudName || !uploadPreset) {
            return { success: false, error: "Cloudinary configuration missing on server" };
        }

        // We need to send a new FormData to Cloudinary
        // Note: standard fetch in Node/Next 15+ handles FormData objects from 'next/server' if we pass body directly,
        // BUT passing the *incoming* FormData directly might be tricky due to boundary headers.
        // It's safer to reconstruct it.
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: uploadData,
                // cache: 'no-store' // implied by POST usually, but good to be explicit or let fetch handle it
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = "Upload failed";
            try {
                const json = JSON.parse(errorText);
                errorMessage = json.error?.message || errorMessage;
            } catch (e) {
                errorMessage = errorText;
            }
            console.error("Cloudinary Upload Error (Server):", errorMessage);
            return { success: false, error: "Cloudinary Error: " + errorMessage };
        }

        const data = await response.json();
        return { success: true, url: data.secure_url };

    } catch (error) {
        console.error("Server Upload Error:", error);
        return { success: false, error: "Server upload failed: " + String(error) };
    }
}
