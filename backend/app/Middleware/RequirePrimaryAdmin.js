const Role = require('../../config/role');

module.exports = requirePrimaryAdmin;

function requirePrimaryAdmin(req, res, next) {
    const isAdmin = req.user?.role === Role.Admin;
    const isModularAdmin = Boolean(req.user?.moduleAccess);

    if (!isAdmin || isModularAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
}
