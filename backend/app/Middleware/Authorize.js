const jwt = require('express-jwt');
const { jwtSecret } = require('../../config/config');
const { User, UserModuleAccess, UserSecurity } = require('../Models');
const { hasModuleAccess, serializeUserForClient } = require('../Utils/module-access');

module.exports = authorize;

function authorize(roles = [], moduleKey = null) {
    const allowedRoles = Array.isArray(roles) ? roles : [];

    return [
        // authenticate JWT token and attach user to request object (req.user)
        jwt({ secret: jwtSecret, algorithms: ['HS256'] }),
        // authorize based on user role
        async (req, res, next) => {
            
            const user = await User.findByPk(req.user.id, {
                include: [
                    {
                        model: UserModuleAccess,
                        as: 'moduleAccess',
                        required: false
                    },
                    {
                        model: UserSecurity,
                        as: 'security',
                        required: false
                    }
                ]
            });

            if (!user || user.status === "inactive") {
                // user no longer exists or role not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }

            if (allowedRoles.length && !allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            if (moduleKey && !hasModuleAccess(user, moduleKey)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // authentication and authorization successful
            req.user = serializeUserForClient(user);
            next();
        }
    ];
}
