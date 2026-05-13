// ** User List Component
import Table from '../ledger/Table'

// ** Reactstrap Imports
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Table as RsTable } from 'reactstrap'
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components
import StatsHorizontal from '@components/widgets/stats/StatsHorizontal'

// ** Icons Imports
import {  UserPlus, UserCheck, DollarSign, Tag, LogIn, LogOut, Percent, Codesandbox } from 'react-feather'

// ** Styles
import '@styles/react/apps/app-users.scss'
import { getAllData, getNextPayments } from './store'
import { useEffect } from 'react'

const UsersList = () => {

  const store = useSelector(state => state.dashboard)
  const { stats, nextPayments } = store

  const currentUser = JSON.parse(localStorage.getItem('userData'))

  const dispatch = useDispatch()

  const toNumber = value => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatCurrency = value => toNumber(value).toFixed(2)
  const formatThreeDecimals = value => toNumber(value).toFixed(3)

  const formatDateTime = value => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString()
  }

  useEffect(() => {
      dispatch(getAllData())
      if (currentUser.role === 'user') dispatch(getNextPayments())
    }, [dispatch, store.data?.length])

  return (
    <div className='app-user-list'>
      <Row>
        {currentUser.role === "admin" && <Col lg='3' sm='6'>
          <StatsHorizontal
            color='success'
            statTitle='Verified Users'
            icon={<UserCheck size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.verifiedUsers)}</h3>}
          />
        </Col>}
        {currentUser.role === "admin" && <Col lg='3' sm='6'>
          <StatsHorizontal
            color='warning'
            statTitle='Pending Users'
            icon={<UserPlus size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.pendingUsers)}</h3>}
          />
        </Col>}
        <Col lg='3' sm='6'>
          <StatsHorizontal
            color='info'
            statTitle='Total Projects'
            icon={<Tag size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.totalProjects)}</h3>}
          />
        </Col>
        <Col lg='3' sm='6'>
          <StatsHorizontal
            color='success'
            statTitle='Total Returns'
            icon={<DollarSign size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{formatThreeDecimals(stats.totalReturns)}</h3>}
          />
        </Col>
        {currentUser.role === "user" && <Col lg='3' sm='6'>
          <StatsHorizontal
            color='success'
            statTitle='Withdrawable Returns'
            icon={<Codesandbox size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{formatThreeDecimals(toNumber(stats.totalReturns) - toNumber(stats.totalWithdrawals))}</h3>}
          />
        </Col>}
        <Col lg='3' sm='6'>
          <StatsHorizontal
            color='success'
            statTitle='Total Investments'
            icon={<LogIn size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.totalInvestments)}</h3>}
          />
        </Col>
        <Col lg='3' sm='6'>
          <StatsHorizontal
            color='danger'
            statTitle='Total Withdrawals'
            icon={<LogOut size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.totalWithdrawals)}</h3>}
          />
        </Col>
        <Col lg='3' sm='6'>
          <StatsHorizontal
            color='success'
            statTitle='Average ROI'
            icon={<Percent size={20} />}
            renderStats={<h3 className='fw-bolder mb-75'>{toNumber(stats.avgRoi).toFixed(2)}</h3>}
          />
        </Col>
      </Row>
      {currentUser.role === "user" && (
        <Card className='overflow-hidden mt-2'>
          <CardHeader>
            <CardTitle tag='h4'>Next Project Payments</CardTitle>
          </CardHeader>
          <CardBody>
            {nextPayments.length === 0 ? (
              <p className='mb-0'>No active investments found for payment schedule.</p>
            ) : (
              <RsTable responsive bordered hover>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Investment</th>
                    <th>ROI</th>
                    <th>Return Period</th>
                    <th>Expected Return</th>
                    <th>Next Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {nextPayments.map(row => (
                    <tr key={row.ledgerId}>
                      <td>{row.projectName || 'N/A'}</td>
                      <td>{formatCurrency(row.investment)} AED</td>
                      <td>{toNumber(row.roi).toFixed(2)}%</td>
                      <td>{row.returnPeriod || 'N/A'}</td>
                      <td>{formatCurrency(row.expectedReturn)} AED</td>
                      <td>{formatDateTime(row.nextPaymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </RsTable>
            )}
          </CardBody>
        </Card>
      )}
      <Table />
    </div>
  )
}

export default UsersList
