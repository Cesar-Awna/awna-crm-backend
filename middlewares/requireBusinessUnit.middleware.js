export const requireBusinessUnitMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (req.user.role === 'SUPER_ADMIN') {
            req.businessUnitId = null;
            return next();
        }

        const businessUnitId = req.headers['x-business-unit-id']?.trim();

        // COMPANY_ADMIN can access all business units (omit header for "all")
        if (req.user.role === 'COMPANY_ADMIN' && !businessUnitId) {
            req.businessUnitId = null;
            return next();
        }

        if (!businessUnitId) {
            return res.status(400).json({
                success: false,
                message: 'Header x-business-unit-id is required',
            });
        }

        const userBusinessUnitIds = req.user.businessUnitIds || [];

        if (!Array.isArray(userBusinessUnitIds)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: invalid business unit context',
            });
        }

        const hasAccess =
            userBusinessUnitIds.length === 0 ||
            userBusinessUnitIds.some(
                (id) => String(id) === String(businessUnitId)
            );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: business unit not allowed',
            });
        }

        req.businessUnitId = businessUnitId;
        next();
    } catch (error) {
        console.error('❌ requireBusinessUnit middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unexpected error',
        });
    }
};

export default requireBusinessUnitMiddleware;
