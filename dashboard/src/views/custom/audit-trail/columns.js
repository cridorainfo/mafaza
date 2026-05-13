import moment from 'moment'

const humanizeAction = value => {
  if (!value) return 'N/A'
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const columns = [
  {
    name: 'Admin',
    selector: row => row.actor?.name || row.actor?.email || 'Deleted Admin',
    sortable: false,
    minWidth: '180px',
    cell: row => <span>{row.actor?.name || row.actor?.email || 'Deleted Admin'}</span>
  },
  {
    name: 'Action',
    selector: row => row.action,
    sortField: 'action',
    sortable: true,
    minWidth: '170px',
    cell: row => <span>{humanizeAction(row.action)}</span>
  },
  {
    name: 'Entity',
    selector: row => row.targetType || '',
    sortField: 'targetType',
    sortable: true,
    minWidth: '130px',
    cell: row => (
      <span className='text-capitalize'>
        {row.targetType || 'N/A'}{row.targetId ? ` #${row.targetId}` : ''}
      </span>
    )
  },
  {
    name: 'Details',
    selector: row => row.description,
    sortable: false,
    minWidth: '360px',
    cell: row => <span>{row.description || 'N/A'}</span>
  },
  {
    name: 'Time',
    selector: row => row.createdAt,
    sortField: 'createdAt',
    sortable: true,
    minWidth: '170px',
    cell: row => <span>{moment(row.createdAt).format('LLL')}</span>
  }
]
