// ** React Imports
import { Link } from 'react-router-dom'
import { useState } from 'react'
import moment from 'moment'
import AssignProject from '../../../components/assign-project'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'
import { Badge } from 'reactstrap'

// ** Store & Actions
import { updateUser } from './store'
import { useDispatch } from 'react-redux'

// ** Icons Imports
import { MoreVertical, UserPlus, Shield, Command, UserCheck, CheckCircle, Lock } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

const ChangeRole = ({ userId, currentRole }) => {
  const dispatch = useDispatch()
  const newRole = currentRole === "admin" ? "user" : "admin"
  const changeRole = () => {
    const toastId = toast.loading("Loading ...")
    try {
      dispatch(
        updateUser({
          toastId,
          userId,
          role: newRole
        })
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  return (
    <DropdownItem
      className='w-100'
      onClick={changeRole}
    >
      <Shield size={14} className='me-50' />
      <span className='align-middle'>Change to {newRole}</span>
    </DropdownItem>
  )
}

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

// ** Renders Role Columns
const renderRole = role => {
  const roleObj = {
    admin: {
      class: 'success',
      icon: Command
    },
    user: {
      class: 'warning',
      icon: UserCheck
    }
  }

  const Icon = roleObj[role] ? roleObj[role].icon : UserCheck

  return (
    <Badge color={roleObj[role] ? roleObj[role].class : ''} pill>
    {role}
    </Badge>
  )
}

const renderStatus = role => {
  const roleObj = {
    verified: {
      class: 'success',
      icon: CheckCircle
    },
    inactive: {
      class: 'danger',
      icon: Lock
    }
  }

  const Icon = roleObj[role] ? roleObj[role].icon : UserCheck

  return (
    <Badge color={roleObj[role] ? roleObj[role].class : ''} pill>
      <Icon/> {role}
    </Badge>
  )
}

const ChangeStatus = ({ userId, currentStatus }) => {
  const newStatus = currentStatus === "verified" ? "inactive" : "verified"
  const dispatch = useDispatch()
  const approve = () => {
    const toastId = toast.loading("Loading ...")
    try {
      dispatch(
        updateUser({
          toastId,
          userId,
          status: newStatus
        })
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  const Icon = newStatus === "verified" ? CheckCircle : Lock
  return (
    <DropdownItem
      className='w-100'
      onClick={approve}
    >
      <Icon size={14} className='me-50' />
      <span className='align-middle'>Make {newStatus}</span>
    </DropdownItem>
  )
}

export const columns = [
  {
    name: 'User',
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
          <small className='text-truncate text-muted mb-0'>{row.phoneNumber}</small>
        </div>
      </div>
    )
  },
  {
    name: 'Address',
    selector: row => row.address,
    cell: row => <span>{row.address || "N/A" }</span>
  },
  {
    name: 'Investment',
    selector: row => row.investment,
    cell: row => <span>{row.investment || "N/A" }</span>
  },
  {
    name: 'Returns',
    selector: row => row.returns,
    cell: row => <span>{row.returns || "N/A" }</span>
  },
  {
    name: 'Role',
    selector: row => row.role,
    cell: row => renderRole(row.role)
  },
  {
    name: 'Status',
    selector: row => row.status,
    cell: row => renderStatus(row.status)
  },
  {
    name: 'Registered At',
    minWidth: '138px',
    selector: row => row.createdAt,
    cell: row => (
      <span className='text-capitalize'>{moment(row.createdAt).format("L")}</span>
    )
  },
  {
    name: 'Actions',
    minWidth: '100px',
    cell: row => {
      const [show, setShow] = useState(false)
      
      return (
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
              <DropdownItem
                className='w-100'
                onClick={() => setShow(true)}
              >
                <UserPlus size={14} className='me-50' />
                <span className='align-middle'>Assign a Project</span>
                
              </DropdownItem>
              <ChangeRole userId={row.id} currentRole={row.role} />
              <ChangeStatus userId={row.id} currentStatus={row.status} />
            </DropdownMenu>
          </UncontrolledDropdown>
          {show && <AssignProject 
            UserId={row.id}
            title={`${row.name}`}
            description="Assign a project to this user"
            show={show} 
            toggle={() => setShow(false)} 
          />}
        </div>
      )
    }
  }
]

