import { v2 as cloudinary } from 'cloudinary';

const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

const hasCloudinaryConfig = () => requiredEnv.every((name) => Boolean(process.env[name]));

const configureCloudinary = () => {
    if (!hasCloudinaryConfig()) return false;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    return true;
};

const uploadPdf = async ({ filePath, publicId, folder }) => {
    if (!configureCloudinary()) throw new Error('Cloudinary is not configured');

    return cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        type: 'authenticated',
        public_id: publicId,
        folder,
        overwrite: true,
    });
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
    buildSignedDownloadUrl,
    deleteRawAsset,
};
