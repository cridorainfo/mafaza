// ** React Imports
import { Link } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'

// ** Custom Components
import { Badge } from 'reactstrap'
import { SafeReceiptLink } from '@components/safe-uploads'

// ** Icons Imports
import { User,  MoreVertical, FileText, CheckCircle, XCircle } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

// ** Store & Actions
import { updateTransaction } from './store'
import { useDispatch } from 'react-redux'
import UploadAdminReceipt from './UploadAdminReceipt'
import { useState } from 'react'

const ApproveTransaction = ({ userId, currentRole, status }) => {
  const dispatch = useDispatch()
  const changeStatus = () => {
    const toastId = toast.loading("Loading ...")
    try {
      dispatch(
        updateTransaction({
          toastId,
          userId,
          status
        })
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  return (
    <DropdownItem
      className='w-100'
      onClick={changeStatus}
    >
      {status === "approved" ? <CheckCircle size={14} className='me-50' /> : <XCircle size={14} className='me-50' />}
      <span className='align-middle'>{status === "approved" ? "Approve" : "Reject"}</span>
    </DropdownItem>
  )
}

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
      class: 'danger'
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
    name: 'ID',
    minWidth: '80px',
    selector: row => row.id,
    sortable: true,
    cell: row => <span>{row.id}</span>
  },
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
      ? <SafeReceiptLink href={row.receipt} className='text-underline border-bottom'>View Receipt</SafeReceiptLink>
      : <span>N/A</span>)
  },
  {
    name: 'Admin Receipt',
    selector: row => row.adminReceipt,
    cell: row => row.adminReceipt ? (
      <SafeReceiptLink href={row.adminReceipt} className='text-underline border-bottom'>View Receipt</SafeReceiptLink>
    ) : (
      <span>N/A</span>
    )
  },
  {
    name: 'Status',
    selector: row => row.status,
    cell: row => renderRole(row.status)
  },
  {
    name: 'Created At',
    minWidth: '138px',
    selector: row => row.date,
    cell: row => (
      <span className='text-capitalize'>{moment(row.date).format("LLL")}</span>
    )
  },
  {
    name: 'Actions',
    minWidth: '100px',
    hideFor: ["user"],
    cell: row => {
      const [sidebarOpen, setSidebarOpen] = useState("")
      const currentUser = JSON.parse(localStorage.getItem('userData') || '{}')
      const canModerateTransactions = currentUser?.role === "admin"
      const canUploadReceipt = row.status === "pending" && row.type !== "return" && row.type !== "investment"
      const canApproveOrReject = row.status === "pending" && row.type !== "return"

      if (!canModerateTransactions || (!canUploadReceipt && !canApproveOrReject)) return null

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
              {canUploadReceipt && (
                <DropdownItem
                  className='w-100'
                  onClick={() => setSidebarOpen("add-transaction")}
                >
                  <FileText size={14} className='me-50' />
                  <span className='align-middle'>Upload Receipt</span>
                </DropdownItem>
              )}
              {canApproveOrReject && <ApproveTransaction status="approved" userId={row.id} currentRole={row.role} />}
              {canApproveOrReject && <ApproveTransaction status="rejected" userId={row.id} currentRole={row.role} />}
            </DropdownMenu>
          </UncontrolledDropdown>
          {canUploadReceipt && (
            <UploadAdminReceipt
              transactionId={row.id}
              open={sidebarOpen === "add-transaction"} 
              toggleSidebar={() => setSidebarOpen("")}
            />
          )}
        </div>
      )
    } 
  }
]

