// ExpandableRow.js
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Table } from 'reactstrap'
import { Edit, Eye } from 'react-feather'
import ChangeRoi from './ChangeRoi'
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

const ExpandableRow = ({ data, triggerRefetch }) => {

  const currentUser = JSON.parse(localStorage.getItem('userData'))
  const canChangeRoi = ["super_admin", "admin"].includes(currentUser?.role)
  const isUserView = currentUser?.role === 'user'
  const canViewPassbook = currentUser?.role === 'admin'

  const [show, setShow] = useState(false)
  const [loadingPassbook, setLoadingPassbook] = useState(false)
  const [passbookError, setPassbookError] = useState('')
  const [passbookEntries, setPassbookEntries] = useState([])
  const { projectDetails = [] } = data || {}
  const projectId = data?.ProjectId
  const projectName = data?.Project?.name || 'Project'

  useEffect(() => {
    if (!isUserView || !projectId) return

    let cancelled = false

    const fetchPassbook = async () => {
      setLoadingPassbook(true)
      setPassbookError('')
      try {
        const rows = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const { data: response } = await axios.get('/transaction', {
            params: {
              ProjectId: projectId,
              status: 'approved',
              sort: 'DESC',
              sortColumn: 'date',
              page,
              perPage: 100
            }
          })

          const pageRows = Array.isArray(response?.data) ? response.data : []
          rows.push(...pageRows)
          totalPages = Number(response?.totalPages) || 1
          page += 1
        }

        if (!cancelled) {
          setPassbookEntries(
            rows.filter(entry => PASSBOOK_VISIBLE_TYPES.has(String(entry?.type || '').toLowerCase()))
          )
        }
      } catch (error) {
        if (!cancelled) {
          setPassbookError('Failed to load passbook entries')
          setPassbookEntries([])
        }
      } finally {
        if (!cancelled) setLoadingPassbook(false)
      }
    }

    fetchPassbook()

    return () => {
      cancelled = true
    }
  }, [isUserView, projectId])

  const passbookSummary = useMemo(() => {
    const totals = passbookEntries.reduce((result, entry) => {
      const amount = Number(entry?.amount)
      const safeAmount = Number.isFinite(amount) ? amount : 0
      const type = String(entry?.type || '').toLowerCase()

      if (type === 'investment') result.investments += safeAmount
      if (type === 'return') result.returns += safeAmount
      if (type === 'withdrawal' || type === 'investment-withdrawal') result.withdrawals += safeAmount
      return result
    }, { investments: 0, returns: 0, withdrawals: 0 })

    const lastPaymentDate = passbookEntries
      .map(entry => new Date(entry?.date))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())?.[0] || null

    return {
      ...totals,
      count: passbookEntries.length,
      lastPaymentDate
    }
  }, [passbookEntries])

  if (isUserView) {
    return (
      <div className='ledger-expandable-table ledger-passbook p-1'>
        <h6 className='mb-1'>Passbook - {projectName}</h6>
        <div className='d-flex flex-wrap gap-2 mb-1'>
          <span className='badge ledger-passbook-chip'>
            Approved Investments: {passbookSummary.investments.toFixed(2)} AED
          </span>
          <span className='badge ledger-passbook-chip'>
            Approved Returns: {passbookSummary.returns.toFixed(2)} AED
          </span>
          <span className='badge ledger-passbook-chip'>
            Approved Withdrawals: {passbookSummary.withdrawals.toFixed(2)} AED
          </span>
          <span className='badge ledger-passbook-chip'>
            Entries: {passbookSummary.count}
          </span>
          <span className='badge ledger-passbook-chip'>
            Last Entry: {passbookSummary.lastPaymentDate ? passbookSummary.lastPaymentDate.toLocaleString() : 'N/A'}
          </span>
        </div>

        {loadingPassbook && <div className='text-muted py-1'>Loading passbook entries...</div>}
        {!loadingPassbook && passbookError && <div className='text-danger py-1'>{passbookError}</div>}
        {!loadingPassbook && !passbookError && passbookEntries.length === 0 && (
          <div className='text-muted py-1'>No approved passbook entries found for this project.</div>
        )}

        {!loadingPassbook && !passbookError && passbookEntries.length > 0 && (
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
              {passbookEntries.map(entry => {
                const type = String(entry?.type || '').toLowerCase()
                const isDebit = type === 'withdrawal' || type === 'investment-withdrawal'
                const amount = (Number(entry?.amount) || 0).toFixed(2)
                const receiptLink = entry?.receipt || entry?.adminReceipt

                return (
                <tr key={entry.id}>
                  <td>{entry?.date ? new Date(entry.date).toLocaleString() : 'N/A'}</td>
                  <td>{getPassbookTypeLabel(type)}</td>
                  <td>{isDebit ? '-' : '+'}{amount} AED</td>
                  <td>{entry?.narration || 'Investment'}</td>
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
    )
  }

  return (
    <div className='ledger-expandable-table'>
      <Table responsive className='ledger-project-table mb-0'>
        <thead>
          <tr>
            <th scope='col' className='text-nowrap'>Project Name</th>
            <th scope='col' className='text-nowrap'>Investment</th>
            <th scope='col' className='text-nowrap'>Returns</th>
            <th scope='col' className='text-nowrap'>Withdrawal</th>
            <th scope='col' className='text-nowrap'>ROI</th>
            <th scope='col' className='text-nowrap'>Passbook</th>
          </tr>
        </thead>
        <tbody>
          {projectDetails.map(p => <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.ledger.investment}</td>
            <td>{p.ledger.returns}</td>
            <td>{p.ledger.withdrawal}</td>
            <td>
              {p.ledger.roi}% {canChangeRoi && <Edit size={14} onClick={() => setShow(p.ledger.ledgerId)} className="ms-1 cursor-pointer" />}
              {show === p.ledger.ledgerId && <ChangeRoi
                ledgerId={p.ledger.ledgerId}
                defaultRoi={p.ledger.roi}
                show={show === p.ledger.ledgerId}
                toggle={() => setShow(false)}
                triggerRefetch={triggerRefetch}
              />}
            </td>
            <td>
              {canViewPassbook && data?.UserId ? (
                <Link
                  to={`/ledger/passbook?userId=${encodeURIComponent(data.UserId)}&projectId=${encodeURIComponent(p.id)}&userName=${encodeURIComponent(data?.User?.name || '')}&projectName=${encodeURIComponent(p.name || '')}`}
                  title='View passbook'
                  className='cursor-pointer'
                >
                  <Eye size={15} />
                </Link>
              ) : (
                <span>N/A</span>
              )}
            </td>
          </tr>
          )}
        </tbody>
      </Table>
      
    </div>
  )
}

export default ExpandableRow
