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
        const userBusinessUnitIds = req.user.businessUnitIds || [];

        console.log('🔍 requireBusinessUnitMiddleware:', {
            userRole: req.user.role,
            userBusinessUnitIds,
            headerBusinessUnitId: businessUnitId,
            userId: req.user._id || req.user.id,
        });

        // COMPANY_ADMIN can access all business units of their company:
        // without header → all BUs; with header → use it as a filter without
        // requiring it in their personal businessUnitIds (admins may have none,
        // and stale sessions/BU switcher state must not lock them out).
        if (req.user.role === 'COMPANY_ADMIN') {
            req.businessUnitId = businessUnitId || null;
            console.log('✅ COMPANY_ADMIN allowed', businessUnitId ? `(BU filter ${businessUnitId})` : '(all BUs)');
            return next();
        }

        // EXECUTIVE and SUPERVISOR without header - service layer will resolve businessUnitId
        if ((req.user.role === 'EXECUTIVE' || req.user.role === 'SUPERVISOR') && !businessUnitId) {
            req.businessUnitId = null;
            console.log('✅ EXECUTIVE/SUPERVISOR without header allowed');
            return next();
        }

        if (!businessUnitId) {
            console.log('❌ Missing header x-business-unit-id');
            return res.status(400).json({
                success: false,
                message: 'Header x-business-unit-id is required',
            });
        }

        if (!Array.isArray(userBusinessUnitIds)) {
            console.log('❌ userBusinessUnitIds is not an array:', userBusinessUnitIds);
            return res.status(403).json({
                success: false,
                message: 'Access denied: invalid business unit context',
            });
        }

        const hasAccess =
            userBusinessUnitIds.length > 0 &&
            userBusinessUnitIds.some(
                (id) => String(id) === String(businessUnitId)
            );

        if (!hasAccess) {
            console.log('❌ Access denied: businessUnitId not in userBusinessUnitIds');
            console.log('   userBusinessUnitIds:', userBusinessUnitIds);
            console.log('   requested businessUnitId:', businessUnitId);
            return res.status(403).json({
                success: false,
                message: 'Access denied: business unit not allowed',
            });
        }

        console.log('✅ Access granted');
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
