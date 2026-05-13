// ** React Imports
import { Link } from 'react-router-dom'
import moment from 'moment'

// ** Custom Components
import { Badge } from 'reactstrap'

// ** Icons Imports
import { User,  MoreVertical, FileText, UserCheck } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

// ** Renders Client Columns
const renderRole = role => {
  const roleObj = {
    approved: {
      class: 'success'
    },
    pending: {
      class: 'warning'
    },
    rejected: {
      class: 'warning'
    }
  }

  return (
    <Badge color={roleObj[role] ? roleObj[role].class : ''} pill>
        {role}
    </Badge>
  )
}


export const columns = [
  {
    name: 'User',
    selector: row => row.User?.id,
    cell: row => <span>{row.User?.name || "N/A" }</span>,
    hideFor: ["user"]
  },
  {
    name: 'Project',
    selector: row => row.Project?.id,
    cell: row => <span>{row.Project?.name || "N/A" }</span>
  },
  {
    name: 'Type',
    selector: row => row.type,
    cell: row => <span className='text-capitalize'>{row.type || "N/A" }</span>
  },
  {
    name: 'Amount',
    selector: row => row.amount,
    cell: row => <span>{row.amount || "N/A" } AED</span>
  },
  {
    name: 'User Receipt',
    selector: row => row.receipt,
    cell: row => (row.type !== 'withdrawal' && row.receipt
      ? <a target='_blank' rel='noreferrer' className='text-underline border-bottom' href={row.receipt}>View Receipt</a>
      : <span>N/A</span>)
  },
  {
    name: 'Admin Receipt',
    selector: row => row.adminReceipt,
    cell: row => row.adminReceipt ? <a target='_blank' className='text-underline border-bottom' href={row.adminReceipt}>View Receipt</a> : <span>N/A</span>
  },
  {
    name: 'Status',
    selector: row => row.status,
    cell: row => renderRole(row.status)
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
          <DropdownMenu>
            <DropdownItem
              className='w-100'
            >
              <FileText size={14} className='me-50' />
              <span className='align-middle'>More Details</span>
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
    )
  }
]
