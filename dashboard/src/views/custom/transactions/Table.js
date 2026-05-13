// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** 
import AddTransaction from './AddTransaction'

// ** Table Columns
import { columns } from './columns'

// ** Store & Actions
import { getAllData, getData } from './store'
import { useDispatch, useSelector } from 'react-redux'

// ** Third Party Components
import Select from 'react-select'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown, Share, Plus, Printer, FileText, File, Grid, Copy } from 'react-feather'
import { useSearchParams } from 'react-router-dom'

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

// ** Table Header
const CustomHeader = ({ store, handlePerPage, rowsPerPage, handleFilter, searchTerm, setSidebarOpen }) => {

  return (
    <div className='invoice-list-table-header w-100 me-1 ms-50 mt-2 mb-75'>
      <Row>
        <Col xl='3' className='d-flex align-items-center p-0'>
          <div className='d-flex align-items-center w-100'>
            <label htmlFor='rows-per-page'>Show</label>
            <Input
              className='mx-50'
              type='select'
              id='rows-per-page'
              value={rowsPerPage}
              onChange={handlePerPage}
              style={{ width: '5rem' }}
            >
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
            </Input>
            <label htmlFor='rows-per-page'>Entries</label>
          </div>
        </Col>
        <Col
          xl='9'
          className='d-flex align-items-sm-center justify-content-xl-end justify-content-start flex-xl-nowrap flex-wrap flex-sm-row flex-column pe-xl-1 p-0 mt-xl-0 mt-1'
        >
          {/* <div className='d-flex align-items-center mb-sm-0 mb-1 me-1'>
            <label className='mb-0' htmlFor='search-invoice'>
              Search:
            </label>
            <Input
              id='search-invoice'
              className='ms-50 w-100'
              type='text'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
            />
          </div> */}

          <div className='d-flex align-items-center table-header-actions'>
            <Button className='me-1' color='primary' onClick={() => setSidebarOpen("add-transaction")}>
              + Add Transaction
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  )
}

const TransactionsTable = () => {
  // ** Store Vars
  const dispatch = useDispatch()
  const store = useSelector(state => state.transactions)
  const [searchParams] = useSearchParams()

  // ** States
  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('date')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sidebarOpen, setSidebarOpen] = useState("")
  const [currentType, setCurrentType] = useState({ value: '', label: 'All Types' })
  const transactionIdFilter = searchParams.get('id')
  const userFilter = searchParams.get('userId')
  const projectFilter = searchParams.get('projectId')
  const includeAdminFilter = searchParams.get('includeAdmin')

  // ** Get data on mount
  useEffect(() => {
    dispatch(getAllData())
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        page: currentPage,
        perPage: rowsPerPage,
        id: transactionIdFilter || undefined,
        type: currentType.value,
        UserId: userFilter || undefined,
        ProjectId: projectFilter || undefined,
        IncludeAdmin: includeAdminFilter || undefined
      })
    )
  }, [dispatch, store.data?.length, sort, sortColumn, currentPage, transactionIdFilter, userFilter, projectFilter, includeAdminFilter])


  // ** Function in get data on page change
  const handlePagination = page => {
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        perPage: rowsPerPage,
        page: page.selected + 1,
        id: transactionIdFilter || undefined,
        type: currentType.value,
        UserId: userFilter || undefined,
        ProjectId: projectFilter || undefined,
        IncludeAdmin: includeAdminFilter || undefined
      })
    )
    setCurrentPage(page.selected + 1)
  }

  // ** Function in get data on rows per page
  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        perPage: value,
        page: currentPage,
        id: transactionIdFilter || undefined,
        type: currentType.value,
        UserId: userFilter || undefined,
        ProjectId: projectFilter || undefined,
        IncludeAdmin: includeAdminFilter || undefined
      })
    )
    setRowsPerPage(value)
  }

  // ** Function in get data on search query change
  const handleFilter = val => {
    setSearchTerm(val)
    dispatch(
      getData({
        sort,
        q: val,
        sortColumn,
        page: currentPage,
        perPage: rowsPerPage,
        id: transactionIdFilter || undefined,
        type: currentType.value,
        UserId: userFilter || undefined,
        ProjectId: projectFilter || undefined,
        IncludeAdmin: includeAdminFilter || undefined
      })
    )
  }

  const currentUser = JSON.parse(localStorage.getItem('userData'))

  // ** Custom Pagination
  const CustomPagination = () => {
    const count = Number(Math.ceil(store.total / rowsPerPage))

    return (
      <ReactPaginate
        previousLabel={''}
        nextLabel={''}
        pageCount={count || 1}
        activeClassName='active'
        forcePage={currentPage !== 0 ? currentPage - 1 : 0}
        onPageChange={page => handlePagination(page)}
        pageClassName={'page-item'}
        nextLinkClassName={'page-link'}
        nextClassName={'page-item next'}
        previousClassName={'page-item prev'}
        previousLinkClassName={'page-link'}
        pageLinkClassName={'page-link'}
        containerClassName={'pagination react-paginate justify-content-end my-2 pe-1'}
      />
    )
  }

  // ** Table data to render
  const dataToRender = () => {
    const filters = {
      type: currentType.value,
      q: searchTerm,
      id: transactionIdFilter || '',
      userId: userFilter || '',
      projectId: projectFilter || '',
      includeAdmin: includeAdminFilter || ''
    }

    const isFiltered = Object.keys(filters).some(function (k) {
      return filters[k].length > 0
    })

    if (store.data?.length > 0) {
      return store.data
    } else if (store.data.length === 0 && isFiltered) {
      return []
    } else {
      return store.allData.slice(0, rowsPerPage)
    }
  }

  const handleSort = (column, sortDirection) => {
    setSort(sortDirection)
    setSortColumn(column.sortField)
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        page: currentPage,
        perPage: rowsPerPage,
        id: transactionIdFilter || undefined,
        type: currentType.value,
        UserId: userFilter || undefined,
        ProjectId: projectFilter || undefined,
        IncludeAdmin: includeAdminFilter || undefined
      })
    )
  }

  return (
    <Fragment>
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle tag='h4'>All Transactions</CardTitle>
        </CardHeader>
        <hr className="v-divider m-0" aria-orientation="horizontal" role="separator"></hr>
        <div className='react-dataTable'>
          <DataTable
            noHeader
            subHeader
            sortServer
            pagination
            responsive
            paginationServer
            columns={columns.filter(col => !col.hideFor || !col.hideFor.includes(currentUser?.role))}
            onSort={handleSort}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={dataToRender()}
            subHeaderComponent={
              <CustomHeader
                store={store}
                searchTerm={searchTerm}
                rowsPerPage={rowsPerPage}
                handleFilter={handleFilter}
                handlePerPage={handlePerPage}
                setSidebarOpen={setSidebarOpen}
              />
            }
          />
        </div>
      </Card>

      <AddTransaction open={sidebarOpen === "add-transaction"} toggleSidebar={() => setSidebarOpen("")} />
    </Fragment>
  )
}

export default TransactionsTable
