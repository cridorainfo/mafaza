const Role = require('../../config/role');

const MODULE_KEYS = ['dashboard', 'users', 'transactions', 'ledger', 'projects'];

const DEFAULT_MODULES_BY_ROLE = {
    [Role.Admin]: {
        dashboard: true,
        users: true,
        transactions: true,
        ledger: true,
        projects: true
    },
    [Role.User]: {
        dashboard: true,
        users: false,
        transactions: true,
        ledger: true,
        projects: true
    },
    [Role.SuperAdmin]: {
        dashboard: true,
        users: true,
        transactions: true,
        ledger: true,
        projects: true
    },
    [Role.Accountant]: {
        dashboard: true,
        users: false,
        transactions: true,
        ledger: true,
        projects: false
    }
};

function getDefaultModulesForRole(role) {
    return DEFAULT_MODULES_BY_ROLE[role] || DEFAULT_MODULES_BY_ROLE[Role.User];
}

function normalizeModuleFlags(source = {}, fallback = {}) {
    return MODULE_KEYS.reduce((result, key) => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            result[key] = Boolean(source[key]);
            return result;
        }

        result[key] = Boolean(fallback[key]);
        return result;
    }, {});
}

function hasStoredModuleAccess(user = {}) {
    return !!user.moduleAccess;
}

function getPlainModuleAccess(moduleAccess) {
    if (!moduleAccess) return null;
    if (typeof moduleAccess.toJSON === 'function') return moduleAccess.toJSON();
    if (typeof moduleAccess.get === 'function') return moduleAccess.get({ plain: true });
    return moduleAccess;
}

function getResolvedModules(user = {}) {
    const storedModuleAccess = getPlainModuleAccess(user.moduleAccess);
    if (hasStoredModuleAccess(user) && storedModuleAccess) {
        return normalizeModuleFlags(storedModuleAccess, {});
    }
    return normalizeModuleFlags({}, getDefaultModulesForRole(user.role));
}

function hasModuleAccess(user = {}, moduleKey) {
    if (!moduleKey) return true;
    if (!MODULE_KEYS.includes(moduleKey)) return false;
    return Boolean(getResolvedModules(user)[moduleKey]);
}

function getRoleName(user = {}) {
    if (user.moduleAccess?.roleName) return user.moduleAccess.roleName;
    return user.role === Role.Admin ? 'Administrator' : 'User';
}

function serializeUserForClient(user = {}) {
    const raw = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete raw.password;

    const requiresPasswordChange = Boolean(raw.security?.mustChangePassword);
    delete raw.security;

    return {
        ...raw,
        modules: getResolvedModules(raw),
        roleName: getRoleName(raw),
        requiresPasswordChange
    };
}

function toModuleAccessRecord(data = {}) {
    const normalizedModules = normalizeModuleFlags(data.modules || {}, {});
    return {
        roleName: data.roleName?.trim() || 'Custom Role',
        ...normalizedModules
    };
}

module.exports = {
    MODULE_KEYS,
    getResolvedModules,
    hasModuleAccess,
    serializeUserForClient,
    toModuleAccessRecord
};
