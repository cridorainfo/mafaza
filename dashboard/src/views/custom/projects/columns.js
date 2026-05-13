import { Link } from 'react-router-dom'
import moment from 'moment'
import { MoreVertical, UserPlus, Edit, Eye } from 'react-feather'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import AssignProject from '../../../components/assign-project'
import { useState } from 'react'

export const getColumns = (setProjectToEdit) => [
  {
    name: 'Name',
    selector: row => row.name,
    cell: row => <span>{row.name || "N/A"}</span>
  },
  {
    name: 'Total Investment',
    selector: row => row.totalInvestement,
    cell: row => <span>{row.totalInvestement || "N/A"}</span>
  },
  {
    name: 'Min ROI',
    selector: row => row.minROI,
    cell: row => <span>{row.minROI || "N/A"}</span>
  },
  {
    name: 'Max ROI',
    selector: row => row.maxROI,
    cell: row => <span>{row.maxROI || "N/A"}</span>
  },
  {
    name: 'Created At',
    minWidth: '138px',
    selector: row => row.createdAt,
    cell: row => (
      <span className='text-capitalize'>{moment(row.createdAt).fromNow()}</span>
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
            <DropdownMenu>
              <DropdownItem
                className='w-100'
                onClick={() => setShow(true)}
              >
                <UserPlus size={14} className='me-50' />
                <span className='align-middle'>Assign To User</span>
              </DropdownItem>
              <DropdownItem
                className='w-100'
                onClick={() => setProjectToEdit(row)}
              >
                <Edit size={14} className='me-50' />
                <span className='align-middle'>Edit</span>
              </DropdownItem>
              <DropdownItem tag={Link} to={`/projects/${row.id}/users`} className='w-100'>
                <Eye size={14} className='me-50' />
                <span className='align-middle'>View</span>
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
          {show && (
            <AssignProject
              ProjectId={row.id}
              title={`${row.name}`}
              description="Assign this project to a user"
              show={show}
              toggle={() => setShow(false)}
            />
          )}
        </div>
      )
    }
  }
]

