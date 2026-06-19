import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isConfigured = !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isConfigured) {
    const url = process.env.CLOUDINARY_URL;
    if (url) {
        const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match) {
            const [, apiKey, apiSecret, cloudName] = match;
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true
            });
            console.log('Cloudinary Service: Explicitly configured from CLOUDINARY_URL connection string.');
        } else {
            cloudinary.config();
            console.log('Cloudinary Service: Initialized using automatic connection string detection.');
        }
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        console.log('Cloudinary Service: Initialized using individual credentials.');
    }
} else {
    console.warn('Cloudinary Service: Configuration credentials not found. Image storage will fallback to base64 database strings.');
}

/**
 * Uploads a base64 image data URL to Cloudinary.
 * If the input is empty/null, returns null.
 * If the input is already a Cloudinary/HTTP URL, returns it as-is.
 * If Cloudinary is not configured or the upload fails, falls back to returning the original base64 string.
 */
export async function uploadImageToCloudinary(imageStr: string | null | undefined): Promise<string | null> {
    if (!imageStr) {
        return null;
    }
    const trimmed = imageStr.trim();
    if (!trimmed) {
        return null;
    }

    // If it's already an HTTP/HTTPS URL, return as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // If it's a base64 image data URL
    if (trimmed.startsWith('data:image/')) {
        if (isConfigured) {
            try {
                const uploadResult = await cloudinary.uploader.upload(trimmed, {
                    folder: 'street_children_profiles',
                    resource_type: 'image',
                });
                return uploadResult.secure_url;
            } catch (error) {
                console.error('Cloudinary Service: Upload failed. Falling back to storing raw base64 string.', error);
                return trimmed;
            }
        } else {
            return trimmed;
        }
    }

    return trimmed;
}
