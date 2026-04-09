/**
 * Factory: returns a middleware that allows only the given roles.
 * @param {string[]} allowedRoles - e.g. ['SUPERVISOR', 'COMPANY_ADMIN']
 * @returns {Function} Express middleware
 */
export const requireRole = (allowedRoles) => {
    const rolesSet = new Set(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]);

    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const userRole = req.user.role;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: no role assigned',
                });
            }

            if (!rolesSet.has(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: insufficient permissions',
                });
            }

            next();
        } catch (error) {
            console.error('❌ requireRole middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected error',
            });
        }
    };
};

export default requireRole;
