// ** User List Component
import PendingTable from './PendingTable'
import UsersTable from './UsersTable'

// ** Reactstrap Imports
import { Row, Col } from 'reactstrap'
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components
import StatsHorizontal from '@components/widgets/stats/StatsHorizontal'

// ** Icons Imports
import {  UserPlus, UserCheck, UserX, Users } from 'react-feather'

// ** Styles
import '@styles/react/apps/app-users.scss'
import moment from 'moment'

const UsersList = () => {

  const store = useSelector(state => state.users)
  const { allData } = store

  return (
    <div className='app-user-list'>
      <PendingTable />
      <UsersTable />
    </div>
  )
}

export default UsersList
