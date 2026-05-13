// ** Reducers Imports
import navbar from './navbar'
import layout from './layout'
import auth from './authentication'
import users from '@src/views/custom/users/store'
import dashboard from '@src/views/custom/dashboard/store'
import transactions from '@src/views/custom/transactions/store'
import projects from '@src/views/custom/projects/store'
import ledger from '@src/views/custom/ledger/store'
import auditTrail from '@src/views/custom/audit-trail/store'
import dataTables from '@src/views/tables/data-tables/store'

const rootReducer = {
  auth,
  navbar,
  layout,
  users,
  dashboard,
  transactions,
  projects,
  ledger,
  auditTrail,
  dataTables
}

export default rootReducer
