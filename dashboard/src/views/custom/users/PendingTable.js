// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Table Columns
import { columns } from './pendingColumns'

// ** Store & Actions
import { getPending } from './store'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown, Share, Plus, Printer, FileText, File, Grid, Copy } from 'react-feather'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Reactstrap Imports
import {
  Row,
  Col,
  Card,
  Input,
  Label,
  Button,
  CardBody,
  CardTitle,
  CardHeader,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  UncontrolledDropdown
} from 'reactstrap'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'


const UsersList = () => {
  // ** Store Vars
  const dispatch = useDispatch()
  const store = useSelector(state => state.users)

  // ** States
  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('id')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sidebarOpen, setSidebarOpen] = useState("")
  const [currentType, setCurrentType] = useState({ value: '', label: 'All Types' })

  // ** Get data on mount
  useEffect(() => {
    dispatch(getPending())
  
  }, [dispatch, store.data?.length, sort, sortColumn, currentPage])

  // ** User filter options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
  ]


  // ** Custom Pagination
  const CustomPagination = () => {
    return <></>
  }

  // ** Table data to render
  const dataToRender = () => {
    const filters = {
      type: currentType.value,
      q: searchTerm
    }

    const isFiltered = Object.keys(filters).some(function (k) {
      return filters[k].length > 0
    })

    if (store.pendingUsers?.length > 0) {
      return store.pendingUsers
    } else if (store.pendingUsers.length === 0 && isFiltered) {
      return []
    } else {
      return store.pendingUsers.slice(0, rowsPerPage)
    }
  }

  const handleSort = (column, sortDirection) => {
    setSort(sortDirection)
    setSortColumn(column.sortField)
  }

  return (
    <Fragment>
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle tag='h4'>Pending Users</CardTitle>
        </CardHeader>
        <div className='react-dataTable'>
          <DataTable
            noHeader
            sortServer
            pagination
            responsive
            paginationServer
            columns={columns}
            onSort={handleSort}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={dataToRender()}
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default UsersList
