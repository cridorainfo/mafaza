import { lazy } from 'react'
import ProfilePage from '../../views/custom/profile'
import AccountSettings from '../../views/custom/account-settings'

const Dashboard = lazy(() => import('../../views/custom/dashboard'))
const Users = lazy(() => import('../../views/custom/users'))
const Transactions = lazy(() => import('../../views/custom/transactions'))
const Ledger = lazy(() => import('../../views/custom/ledger'))
const LedgerPassbook = lazy(() => import('../../views/custom/ledger/PassbookPage'))
const Projects = lazy(() => import('../../views/custom/projects'))
const ModularAccess = lazy(() => import('../../views/custom/modular-access'))
const AuditTrail = lazy(() => import('../../views/custom/audit-trail'))
const ProjectUsersPage = lazy(() => import('../../views/custom/projects/ProjectUsersPage'))
const ForcePasswordReset = lazy(() => import('../../views/pages/authentication/ForcePasswordReset'))

const DashboardRoutes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    meta: {
      module: 'dashboard'
    }
  },
  {
    path: '/account-settings',
    element: <AccountSettings />
  },
  {
    path: '/users',
    element: <Users />,
    meta: {
      module: 'users'
    }
  },
  {
    path: '/transactions',
    element: <Transactions />,
    meta: {
      module: 'transactions'
    }
  },
  {
    path: '/ledger',
    element: <Ledger />,
    meta: {
      module: 'ledger'
    }
  },
  {
    path: '/ledger/passbook',
    element: <LedgerPassbook />,
    meta: {
      module: 'ledger'
    }
  },
  {
    path: '/projects',
    element: <Projects />,
    meta: {
      module: 'projects'
    }
  },
  {
    path: '/modular-access',
    element: <ModularAccess />,
    meta: {
      primaryAdminOnly: true,
      module: 'users'
    }
  },
  {
    path: '/audit-trail',
    element: <AuditTrail />,
    meta: {
      primaryAdminOnly: true,
      module: 'users'
    }
  },
  {
    path: '/projects/:projectId/users',
    element: <ProjectUsersPage />,
    meta: {
      module: 'projects'
    }
  },
  {
    path: '/profile/:userId',
    element: <ProfilePage />
  },
  {
    path: '/force-password-reset',
    element: <ForcePasswordReset />
  },
]

export default DashboardRoutes
