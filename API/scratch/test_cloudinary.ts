import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

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
    }
}

async function testUpload() {
    try {
        // Real valid 2x2 PNG image base64
        const realPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBhXY2A48P8/AwgwwMgAAFiGBADk2B9AAAAAAElFTkSuQmCC';
        const res = await cloudinary.uploader.upload(realPngBase64, { folder: 'test_folder' });
        console.log('Upload Success! URL:', res.secure_url);
    } catch (err) {
        console.error('Upload Error:', err);
    }
}

testUpload();
