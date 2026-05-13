import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Button, Card, CardBody, CardHeader, CardTitle, Table } from 'reactstrap'
import { SafeReceiptLink } from '@components/safe-uploads'

const PASSBOOK_VISIBLE_TYPES = new Set(['investment', 'return', 'withdrawal', 'investment-withdrawal'])

const getPassbookTypeLabel = type => {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'investment') return 'Investment'
  if (normalized === 'return') return 'Return'
  if (normalized === 'withdrawal') return 'Withdrawal'
  if (normalized === 'investment-withdrawal') return 'Investment Withdrawal'
  return 'Other'
}

const PassbookPage = () => {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const projectId = searchParams.get('projectId')
  const userName = searchParams.get('userName') || 'User'
  const projectName = searchParams.get('projectName') || (projectId ? `Project #${projectId}` : 'Project')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState([])

  useEffect(() => {
    if (!projectId) {
      setError('Project is required')
      setEntries([])
      return
    }

    let cancelled = false

    const fetchPassbook = async () => {
      setLoading(true)
      setError('')
      try {
        const rows = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const params = {
            ProjectId: projectId,
            status: 'approved',
            sort: 'DESC',
            sortColumn: 'date',
            page,
            perPage: 100
          }

          if (userId) params.UserId = userId

          const { data: response } = await axios.get('/transaction', { params })
          const pageRows = Array.isArray(response?.data) ? response.data : []
          rows.push(...pageRows)
          totalPages = Number(response?.totalPages) || 1
          page += 1
        }

        if (!cancelled) {
          setEntries(rows.filter(entry => PASSBOOK_VISIBLE_TYPES.has(String(entry?.type || '').toLowerCase())))
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load passbook entries')
          setEntries([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPassbook()

    return () => {
      cancelled = true
    }
  }, [projectId, userId])

  const summary = useMemo(() => {
    const totals = entries.reduce((result, entry) => {
      const amount = Number(entry?.amount)
      const safeAmount = Number.isFinite(amount) ? amount : 0
      const type = String(entry?.type || '').toLowerCase()

      if (type === 'investment') result.investments += safeAmount
      if (type === 'return') result.returns += safeAmount
      if (type === 'withdrawal' || type === 'investment-withdrawal') result.withdrawals += safeAmount
      return result
    }, { investments: 0, returns: 0, withdrawals: 0 })

    const lastEntryDate = entries
      .map(entry => new Date(entry?.date))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())?.[0] || null

    return {
      ...totals,
      count: entries.length,
      lastEntryDate
    }
  }, [entries])

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='d-flex align-items-center justify-content-between'>
        <div>
          <CardTitle tag='h4' className='mb-0'>
            Passbook - {projectName}
          </CardTitle>
          <small className='text-muted'>User: {userName}</small>
        </div>
        <Button tag={Link} to='/ledger' color='secondary' outline>
          Back
        </Button>
      </CardHeader>
      <CardBody>
        <div className='ledger-expandable-table ledger-passbook p-1'>
          <div className='d-flex flex-wrap gap-2 mb-1'>
            <span className='badge ledger-passbook-chip'>
              Approved Investments: {summary.investments.toFixed(2)} AED
            </span>
            <span className='badge ledger-passbook-chip'>
              Approved Returns: {summary.returns.toFixed(2)} AED
            </span>
            <span className='badge ledger-passbook-chip'>
              Approved Withdrawals: {summary.withdrawals.toFixed(2)} AED
            </span>
            <span className='badge ledger-passbook-chip'>
              Entries: {summary.count}
            </span>
            <span className='badge ledger-passbook-chip'>
              Last Entry: {summary.lastEntryDate ? summary.lastEntryDate.toLocaleString() : 'N/A'}
            </span>
          </div>

          {loading && <div className='text-muted py-1'>Loading passbook entries...</div>}
          {!loading && error && <div className='text-danger py-1'>{error}</div>}
          {!loading && !error && entries.length === 0 && (
            <div className='text-muted py-1'>No approved passbook entries found.</div>
          )}

          {!loading && !error && entries.length > 0 && (
            <Table responsive className='ledger-project-table mb-0'>
              <thead>
                <tr>
                  <th scope='col' className='text-nowrap'>Date</th>
                  <th scope='col' className='text-nowrap'>Type</th>
                  <th scope='col' className='text-nowrap'>Amount</th>
                  <th scope='col' className='text-nowrap'>Narration</th>
                  <th scope='col' className='text-nowrap'>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const type = String(entry?.type || '').toLowerCase()
                  const isDebit = type === 'withdrawal' || type === 'investment-withdrawal'
                  const amount = (Number(entry?.amount) || 0).toFixed(2)
                  const receiptLink = entry?.receipt || entry?.adminReceipt

                  return (
                    <tr key={entry.id}>
                      <td>{entry?.date ? new Date(entry.date).toLocaleString() : 'N/A'}</td>
                      <td>{getPassbookTypeLabel(type)}</td>
                      <td>{isDebit ? '-' : '+'}{amount} AED</td>
                      <td>{entry?.narration || 'N/A'}</td>
                      <td>
                        {receiptLink ? (
                          <SafeReceiptLink href={receiptLink}>View Receipt</SafeReceiptLink>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default PassbookPage
