// ** React Imports
import { Link } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { updateUser } from './store'
import { useDispatch } from 'react-redux'

// ** Icons Imports
import { MoreVertical, UserCheck, UserX } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

// ** Renders Client Columns
const renderClient = row => {
  return <Avatar
    initials
    img={row.avatar || false}
    className='me-1'
    color={row.avatarColor || 'light-primary'}
    content={row.name || 'John Doe'}
  />
}

const ApproveUser = ({ userId }) => {
  const dispatch = useDispatch()
  const approve = () => {
    const toastId = toast.loading("Loading ...")
    try {
      dispatch(
        updateUser({
          toastId,
          userId,
          status: "verified"
        })
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  return (
    <DropdownItem
      className='w-100'
      onClick={approve}
    >
      <UserCheck size={14} className='me-50' />
      <span className='align-middle'>Approve</span>
    </DropdownItem>
  )
}

const RejectUser = ({ userId }) => {
  const dispatch = useDispatch()
  const reject = () => {
    const toastId = toast.loading("Loading ...")
    try {
      dispatch(
        updateUser({
          toastId,
          userId,
          status: "rejected"
        })
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  return (
    <DropdownItem
      className='w-100'
      onClick={reject}
    >
      <UserX size={14} className='me-50' />
      <span className='align-middle'>Reject</span>
    </DropdownItem>
  )
}

export const columns = [
  {
    name: 'Name',
    minWidth: '250px',
    selector: row => row.name,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center'>
        {renderClient(row)}
        <div className='d-flex flex-column'>
          <Link
            to={`#`}
            className='user_name text-truncate text-body'
          >
            <span className='fw-bolder'>{row.name}</span>
          </Link>
          <small className='text-truncate text-muted mb-0'>{row.email}</small>
        </div>
      </div>
    )
  },
  {
    name: 'Phone number',
    minWidth: '200px',
    selector: row => row.phoneNumber,
    cell: row => <span>{row.phoneNumber || "N/A" }</span>
  },
  {
    name: 'Address',
    minWidth: '200px',
    selector: row => row.address,
    cell: row => <span>{row.address || "N/A" }</span>
  },
  {
    name: 'Registered At',
    minWidth: '138px',
    selector: row => row.createdAt,
    cell: row => (
      <span className='text-capitalize'>{moment(row.createdAt).fromNow()}</span>
    )
  },
  {
    name: 'Actions',
    minWidth: '100px',
    cell: row => (
      <div className='column-action'>
        <UncontrolledDropdown>
          <DropdownToggle tag='div' className='btn btn-sm'>
            <MoreVertical size={14} className='cursor-pointer' />
          </DropdownToggle>
          <DropdownMenu
            end
            container='body'
            flip
            modifiers={[
              {
                name: 'offset',
                options: { offset: [0, 6] }
              }
            ]}
          >
            <ApproveUser userId={row.id} />
            <RejectUser userId={row.id} />
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
    )
  }
]

