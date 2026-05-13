import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input, CardTitle, CardHeader } from 'reactstrap'
import { columns } from './columns'
import { getData } from './store'
import '@styles/react/libs/tables/react-dataTable-component.scss'

const CustomHeader = ({ rowsPerPage, handlePerPage, searchTerm, handleFilter }) => {
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
          <div className='d-flex align-items-center mb-sm-0 mb-1 me-1'>
            <label className='mb-0' htmlFor='search-audit'>
              Search:
            </label>
            <Input
              id='search-audit'
              className='ms-50 w-100'
              type='text'
              value={searchTerm}
              placeholder='Action or details'
              onChange={e => handleFilter(e.target.value)}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

const AuditTrailTable = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.auditTrail)

  const [sort, setSort] = useState('DESC')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('createdAt')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const fetchLogs = ({ page = currentPage, perPage = rowsPerPage, sortValue = sort, sortColumnValue = sortColumn, q = searchTerm } = {}) => {
    dispatch(
      getData({
        page,
        perPage,
        sort: sortValue,
        sortColumn: sortColumnValue,
        q
      })
    )
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, rowsPerPage, sort, sortColumn])

  const handlePagination = page => {
    const nextPage = page.selected + 1
    setCurrentPage(nextPage)
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  const handleFilter = value => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchLogs({ page: 1, q: value })
  }

  const handleSort = (column, sortDirection) => {
    const nextSort = String(sortDirection || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const nextSortColumn = column.sortField || 'createdAt'
    setSort(nextSort)
    setSortColumn(nextSortColumn)
  }

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

  return (
    <Fragment>
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle tag='h4'>Audit Trail</CardTitle>
        </CardHeader>
        <hr className='v-divider m-0' aria-orientation='horizontal' role='separator'></hr>
        <div className='react-dataTable'>
          <DataTable
            noHeader
            subHeader
            sortServer
            pagination
            responsive
            paginationServer
            columns={columns}
            onSort={handleSort}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={store.data || []}
            subHeaderComponent={
              <CustomHeader
                rowsPerPage={rowsPerPage}
                handlePerPage={handlePerPage}
                searchTerm={searchTerm}
                handleFilter={handleFilter}
              />
            }
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default AuditTrailTable
