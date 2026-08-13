import { v2 as cloudinary } from 'cloudinary';

const hasCloudinaryConfig = () =>
    Boolean(process.env.CLOUDINARY_URL) ||
    ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((n) => Boolean(process.env[n]));

const configureCloudinary = () => {
    if (!hasCloudinaryConfig()) return false;
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    } else {
        // CLOUDINARY_URL is read automatically by the SDK
        cloudinary.config({ secure: true });
    }
    return true;
};

const uploadPdf = async ({ filePath, publicId, folder }) => {
    if (!configureCloudinary()) throw new Error('Cloudinary is not configured');

    return cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        type: 'upload',
        public_id: publicId,
        folder,
        overwrite: true,
    });
};

const uploadImage = async ({ filePath, publicId, folder }) => {
    if (!configureCloudinary()) throw new Error('Cloudinary is not configured');

    return cloudinary.uploader.upload(filePath, {
        resource_type: 'image',
        type: 'upload',
        public_id: publicId,
        folder,
        overwrite: true,
    });
};

const getPdfThumbnailUrl = (publicId) => {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.match(/@(.+)$/)?.[1];
    if (!cloud) return null;
    return `https://res.cloudinary.com/${cloud}/image/upload/w_160,h_200,c_fit,pg_1/${publicId}.jpg`;
};

/**
 * Enlace firmado para descargar/ver un raw authenticated.
 * En varios product environments las URLs de CDN (/res.cloudinary.com/.../s--/) devuelven 401 aunque la firma sea válida;
 * el endpoint firmado `.../raw/download` sí entrega el archivo.
 */
const buildSignedDownloadUrl = ({ publicId, expiresInSeconds = 300 } = {}) => {
    if (!configureCloudinary()) throw new Error('Cloudinary is not configured');
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.utils.private_download_url(publicId, undefined, {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: expiresAt,
    });
};

const deleteRawAsset = async ({ publicId }) => {
    if (!configureCloudinary()) throw new Error('Cloudinary is not configured');
    return cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
        type: 'authenticated',
        invalidate: true,
    });
};

export {
    hasCloudinaryConfig,
    uploadPdf,
    uploadImage,
    getPdfThumbnailUrl,
    buildSignedDownloadUrl,
    deleteRawAsset,
};
