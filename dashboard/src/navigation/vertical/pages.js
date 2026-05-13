// ** Icons Import
import { PieChart, Users, UserCheck, DollarSign, Table, Shield, Activity } from 'react-feather'

export default [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <PieChart size={16} />,
    navLink: '/dashboard',
    moduleKey: 'dashboard',
    roles: ["user", "admin"]
  },
  {
    id: 'users',
    title: 'Users',
    icon: <UserCheck size={16} />,
    navLink: '/users',
    moduleKey: 'users',
    roles: ["admin"]
  },
  {
    id: 'transactions',
    title: 'Transactions',
    icon: <DollarSign size={16} />,
    navLink: '/transactions',
    moduleKey: 'transactions',
    roles: ["admin", "user"]
  },
  {
    id: 'ledger',
    title: 'User Ledger',
    icon: <Users size={16} />,
    navLink: '/ledger',
    moduleKey: 'ledger',
    roles: ["admin"]
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: <Table size={16} />,
    navLink: '/projects',
    moduleKey: 'projects',
    roles: ["admin", "user"]
  },
  {
    id: 'modular-access',
    title: 'Modular Access',
    icon: <Shield size={16} />,
    navLink: '/modular-access',
    primaryAdminOnly: true,
    moduleKey: 'users',
    roles: ["admin"]
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    icon: <Activity size={16} />,
    navLink: '/audit-trail',
    primaryAdminOnly: true,
    moduleKey: 'users',
    roles: ["admin"]
  },
]
