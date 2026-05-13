export const MODULE_KEYS = ['dashboard', 'users', 'transactions', 'ledger', 'projects']

const DEFAULT_MODULES_BY_ROLE = {
  admin: {
    dashboard: true,
    users: true,
    transactions: true,
    ledger: true,
    projects: true
  },
  user: {
    dashboard: true,
    users: false,
    transactions: true,
    ledger: true,
    projects: true
  },
  super_admin: {
    dashboard: true,
    users: true,
    transactions: true,
    ledger: true,
    projects: true
  },
  accountant: {
    dashboard: true,
    users: false,
    transactions: true,
    ledger: true,
    projects: false
  }
}

const normalizeModules = source =>
  MODULE_KEYS.reduce((result, key) => {
    result[key] = Boolean(source?.[key])
    return result
  }, {})

export const getResolvedModules = user => {
  if (user?.modules) return normalizeModules(user.modules)
  if (user?.moduleAccess) return normalizeModules(user.moduleAccess)

  const defaults = DEFAULT_MODULES_BY_ROLE[user?.role] || DEFAULT_MODULES_BY_ROLE.user
  return normalizeModules(defaults)
}

export const canAccessModule = (user, moduleKey) => {
  if (!moduleKey) return true
  if (!MODULE_KEYS.includes(moduleKey)) return false
  return Boolean(getResolvedModules(user)[moduleKey])
}

export const isPrimaryAdmin = user => {
  const isAdmin = user?.role === 'admin'
  const isModularAdmin = Boolean(user?.moduleAccess)
  return isAdmin && !isModularAdmin
}

export const getFirstAccessibleRoute = user => {
  const modules = getResolvedModules(user)

  if (modules.dashboard) return '/dashboard'
  if (modules.transactions) return '/transactions'
  if (modules.projects) return '/projects'
  if (modules.ledger) return '/ledger'
  if (modules.users) return '/users'
  return '/auth/not-auth'
}
