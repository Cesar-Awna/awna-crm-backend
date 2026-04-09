import connectMongoDB from '../libs/mongoose.js';
import LeadDocument from '../models/LeadDocument.js';
import Lead from '../models/Lead.js';
import { buildSignedDownloadUrl, deleteRawAsset, hasCloudinaryConfig, uploadPdf } from '../libs/cloudinary.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export default class LeadDocumentsService {
    constructor() {
        connectMongoDB();
    }

    getByLeadId = async (req) => {
        try {
            const { leadId } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await LeadDocument.find({ leadId, companyId, businessUnitId }).lean();
            return {
                success: true,
                message: 'Lead documents by lead retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead documents by lead' };
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const data = await LeadDocument.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!data) return { success: false, message: 'Lead document not found' };
            return { success: true, message: 'Lead document retrieved successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving lead document' };
        }
    };

    upload = async (req) => {
        try {
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            if (!hasCloudinaryConfig()) {
                return { success: false, message: 'Cloudinary is not configured. Please set CLOUDINARY env vars.' };
            }
            const body = req.body || {};
            const file = req.files?.file || req.files?.document;
            if (!file) {
                return { success: false, message: 'File is required' };
            }
            if (file.mimetype !== 'application/pdf') {
                return { success: false, message: 'Only PDF files are allowed' };
            }

            const rawMetadata = body.metadata;
            let metadata = undefined;
            if (typeof rawMetadata === 'string' && rawMetadata.trim()) {
                try {
                    metadata = JSON.parse(rawMetadata);
                } catch {
                    metadata = { raw: rawMetadata };
                }
            } else if (rawMetadata && typeof rawMetadata === 'object') {
                metadata = rawMetadata;
            }

            const fileBuffer = file.tempFilePath
                ? await fs.readFile(file.tempFilePath)
                : file.data;
            if (!fileBuffer || !fileBuffer.length) {
                return { success: false, message: 'Could not read uploaded file' };
            }
            if (!file.tempFilePath) {
                return { success: false, message: 'Temporary file path is required for upload.' };
            }

            const safeName = path.basename(file.name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
            const objectKey = [
                String(companyId),
                String(businessUnitId),
                String(body.leadId || 'unknown'),
                `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
            ].join('/');

            const uploadResult = await uploadPdf({
                filePath: file.tempFilePath,
                publicId: objectKey,
                folder: 'leads',
            });
            if (file.tempFilePath) {
                fs.unlink(file.tempFilePath).catch(() => {});
            }

            const doc = await LeadDocument.create({
                ...body,
                companyId,
                businessUnitId,
                fileUrl: uploadResult.secure_url,
                storageProvider: 'CLOUDINARY',
                storageBucket: process.env.CLOUDINARY_CLOUD_NAME,
                storageKey: uploadResult.public_id,
                cloudinaryVersion: uploadResult.version,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                uploadedByUserId: body.uploadedByUserId || req.user?.id || req.user?._id || '',
                metadata,
            });
            return { success: true, message: 'Document uploaded successfully', data: doc };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error uploading document' };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const doc = await LeadDocument.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!doc) return { success: false, message: 'Lead document not found' };

            if (req.user?.role === 'EXECUTIVE') {
                const lead = await Lead.findOne({ _id: doc.leadId, companyId, businessUnitId }).lean();
                if (!lead) return { success: false, message: 'Lead not found' };
                const uid = req.user?.id || req.user?._id;
                if (String(lead.ownerUserId) !== String(uid)) {
                    return { success: false, message: 'No autorizado a eliminar este documento' };
                }
            }

            await LeadDocument.findOneAndDelete({ _id: id, companyId, businessUnitId });
            if (doc.storageProvider === 'CLOUDINARY' && doc.storageKey && hasCloudinaryConfig()) {
                try {
                    await deleteRawAsset({ publicId: doc.storageKey });
                } catch (error) {
                    console.error('❌ Could not delete file in Cloudinary:', error);
                }
            }
            return { success: true, message: 'Lead document deleted successfully', data: doc };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error deleting lead document' };
        }
    };

    download = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            const businessUnitId = req.businessUnitId;
            if (!companyId || !businessUnitId) {
                return { success: false, message: 'Company and business unit context required' };
            }
            const doc = await LeadDocument.findOne({ _id: id, companyId, businessUnitId }).lean();
            if (!doc) return { success: false, message: 'Lead document not found' };
            if (doc.storageProvider === 'CLOUDINARY' && doc.storageKey) {
                if (!hasCloudinaryConfig()) {
                    return { success: false, message: 'Cloudinary is not configured. Cannot generate download URL.' };
                }
                const rawExp = Number(req.query?.expiresIn);
                const expiresInSeconds = Number.isFinite(rawExp)
                    ? Math.min(Math.max(rawExp, 60), 7200)
                    : 300;
                const signedUrl = buildSignedDownloadUrl({
                    publicId: doc.storageKey,
                    expiresInSeconds,
                });
                return {
                    success: true,
                    message: 'Download URL',
                    data: doc,
                    redirectUrl: signedUrl,
                };
            }
            return {
                success: true,
                message: 'Download URL',
                data: doc,
                redirectUrl: doc.fileUrl || null,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving download' };
        }
    };
}
