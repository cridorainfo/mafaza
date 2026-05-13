// ** React Imports
import { Fragment, useState, useEffect } from 'react'

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
import ExpandableRow from './ExpandableRow'

// ** Table Header
const CustomHeader = ({ store, handlePerPage, rowsPerPage, handleFilter, searchTerm, setSidebarOpen }) => {
  const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const toTimestamp = (value) => {
    if (!value) return null
    const ts = new Date(value).getTime()
    return Number.isNaN(ts) ? null : ts
  }

  const getRowDate = (row) => {
    const directCandidates = [
      row?.date,
      row?.updatedAt,
      row?.createdAt,
      row?.User?.updatedAt,
      row?.User?.createdAt,
      row?.Project?.updatedAt,
      row?.Project?.createdAt
    ]

    const nestedCandidates = (row?.projectDetails || []).reduce((acc, project) => {
      acc.push(project?.ledger?.date)
      acc.push(project?.ledger?.updatedAt)
      acc.push(project?.ledger?.createdAt)
      acc.push(project?.updatedAt)
      acc.push(project?.createdAt)
      return acc
    }, [])

    const timestamps = [...directCandidates, ...nestedCandidates]
      .map(toTimestamp)
      .filter((value) => value !== null)

    if (timestamps.length) return new Date(Math.max(...timestamps)).toLocaleString()

    return 'N/A'
  }

  const getExportRows = (array = []) =>
    array.map(it => ({
      User: it?.User?.name || 'N/A',
      Project: it?.Project?.name || it?.projectDetails?.map(p => p.name).join('|') || 'N/A',
      Investment: it?.investment ?? 0,
      Returns: it?.returns ?? 0,
      Withdrawal: it?.withdrawal ?? 0,
      'Overall Balance': (toNumber(it?.investment) + toNumber(it?.returns) - toNumber(it?.withdrawal)).toFixed(2),
      Date: getRowDate(it)
    }))

  const escapeCSVValue = (value) => {
    const stringValue = String(value ?? '')
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  // ** Converts table to CSV
  function convertArrayOfObjectsToCSV(array) {
    const array2 = getExportRows(array)
    if (!array2.length) return null

    const columnDelimiter = ','
    const lineDelimiter = '\n'
    const keys = Object.keys(array2[0])

    const header = keys.join(columnDelimiter)
    const body = array2
      .map(item => keys.map(key => escapeCSVValue(item[key])).join(columnDelimiter))
      .join(lineDelimiter)

    return `${header}${lineDelimiter}${body}`
  }

  // ** Downloads CSV
  function downloadCSV(array) {
    const link = document.createElement('a')
    let csv = convertArrayOfObjectsToCSV(array)
    if (csv === null) return

    const filename = 'export.csv'

    if (!csv.match(/^data:text\/csv/i)) {
      csv = `data:text/csv;charset=utf-8,${csv}`
    }

    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', filename)
    link.click()
  }

  function downloadPDF(array) {
    const rows = getExportRows(array)
    if (!rows.length) return

    const headers = Object.keys(rows[0])
    const tableHead = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')
    const tableBody = rows
      .map(row => `<tr>${headers.map(key => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`)
      .join('')

    const popup = window.open('', '_blank')
    if (!popup) return

    popup.document.write(`
      <html>
        <head>
          <title>Ledger Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h2 { margin: 0 0 6px; }
            p { margin: 0 0 14px; color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) td { background: #fafafa; }
          </style>
        </head>
        <body>
          <h2>Ledger Export</h2>
          <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
          <table>
            <thead><tr>${tableHead}</tr></thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    setTimeout(() => popup.print(), 200)
  }

  const user = JSON.parse(localStorage.getItem('userData'))
  const canSearchUsers = ['admin', 'super_admin'].includes(user?.role)

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
          {canSearchUsers && (
            <div className='d-flex align-items-center mb-sm-0 mb-1 me-1'>
              <label className='mb-0 text-nowrap' htmlFor='search-ledger-user'>
                Search User:
              </label>
              <Input
                id='search-ledger-user'
                className='ms-50 w-100'
                type='text'
                placeholder='Name, email, phone'
                value={searchTerm}
                onChange={e => handleFilter(e.target.value)}
              />
            </div>
          )}

          <div className='d-flex align-items-center table-header-actions'>
            <UncontrolledDropdown className='me-1'>
              <DropdownToggle color='secondary' caret outline>
                <Share className='font-small-4 me-50' />
                <span className='align-middle'>Export</span>
              </DropdownToggle>
              <DropdownMenu>
                {/* <DropdownItem className='w-100'>
                  <Printer className='font-small-4 me-50' />
                  <span className='align-middle'>Print</span>
                </DropdownItem> */}
                <DropdownItem className='w-100' onClick={() => downloadCSV(store.allData)}>
                  <FileText className='font-small-4 me-50' />
                  <span className='align-middle'>CSV</span>
                </DropdownItem>
                <DropdownItem className='w-100' onClick={() => downloadPDF(store.allData)}>
                  <File className='font-small-4 me-50' />
                  <span className='align-middle'>PDF</span>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
        </Col>
      </Row>
    </div>
  )
}

const UsersList = () => {
  // ** Store Vars
  const dispatch = useDispatch()
  const store = useSelector(state => state.ledger)
  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}')

  // ** States
  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('id')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sidebarOpen, setSidebarOpen] = useState("")
  const [currentType, setCurrentType] = useState({ value: '', label: 'All Types' })

  const [refetch, setRefetch] = useState(0)
  const triggerRefetch = () => setRefetch(prev => prev + 1)

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
        type: currentType.value
      })
    )
  }, [dispatch, store.data?.length, sort, sortColumn, currentPage, refetch])


  // ** Function in get data on page change
  const handlePagination = page => {
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        perPage: rowsPerPage,
        page: page.selected + 1,
        type: currentType.value,
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
        type: currentType.value,
      })
    )
    setRowsPerPage(value)
  }

  // ** Function in get data on search query change
  const handleFilter = val => {
    setSearchTerm(val)
    setCurrentPage(1)
    dispatch(
      getData({
        sort,
        q: val,
        sortColumn,
        page: 1,
        perPage: rowsPerPage,
        type: currentType.value,
      })
    )
  }

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
      q: searchTerm
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
        type: currentType.value,
      })
    )
  }

  return (
    <Fragment>
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle tag='h4'>User Ledger</CardTitle>
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
            expandableRows
            expandableRowsComponent={ExpandableRow}
            expandableRowsComponentProps={{ triggerRefetch }}
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

    </Fragment>
  )
}

export default UsersList
