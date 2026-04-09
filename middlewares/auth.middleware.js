import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }

        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }

        if (!JWT_SECRET) {
            console.error('❌ JWT_SECRET is not defined');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error',
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.id || decoded._id || decoded.userId,
            companyId: decoded.companyId,
            role: decoded.role || decoded.roleName,
            businessUnitIds: decoded.businessUnitIds || [],
            teamId: decoded.teamId || null,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
        console.error('❌ Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
};

export default authMiddleware;
