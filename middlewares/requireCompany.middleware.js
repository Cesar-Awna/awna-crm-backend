import BusinessUnit from '../models/BusinessUnit.js';

export const requireCompanyMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        const role = req.user.role;

        // SUPER_ADMIN has no company context.
        if (role === 'SUPER_ADMIN') {
            req.companyId = null;
            return next();
        }

        let companyId = req.user.companyId;

        // If companyId is missing (e.g. inconsistent legacy data), derive it from
        // business unit context. This keeps the system resilient and avoids
        // breaking `/api/auth/me` for roles that already send BU context.
        if (!companyId) {
            const headerBusinessUnitId =
                req.headers['x-business-unit-id']?.trim();
            const userFirstBusinessUnitId =
                req.user.businessUnitIds?.length > 0
                    ? req.user.businessUnitIds[0]
                    : null;

            const businessUnitId =
                headerBusinessUnitId || userFirstBusinessUnitId;

            if (businessUnitId) {
                const bu = await BusinessUnit.findById(businessUnitId)
                    .select('companyId')
                    .lean();
                if (bu?.companyId) {
                    companyId = bu.companyId;
                }
            }
        }

        if (!companyId) {
            return res.status(403).json({
                success: false,
                message: 'Company context required',
            });
        }

        req.companyId = companyId;
        next();
    } catch (error) {
        console.error('❌ requireCompany middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unexpected error',
        });
    }
};

export default requireCompanyMiddleware;
