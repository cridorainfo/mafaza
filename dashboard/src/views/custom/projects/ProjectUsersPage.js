import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Input
} from 'reactstrap'
import { getTestingModeEnabled } from '@utils'
import './projects.scss'

const baseReturnPeriodOptions = [
  { value: 'annual', label: 'Annual' },
  { value: 'semi-annual', label: 'Semi-annual' },
  { value: 'quarterly', label: 'Quarterly' }
]

const getReturnPeriodOptions = () =>
  getTestingModeEnabled()
    ? [...baseReturnPeriodOptions, { value: 'testing', label: 'Testing (3 hours)' }]
    : baseReturnPeriodOptions

const getApiErrorMessage = (error, fallbackMessage) => {
  const payload = error?.response?.data
  if (payload?.message) return payload.message

  if (typeof payload === 'string') {
    const preMatch = payload.match(/<pre>(.*?)<\/pre>/i)
    if (preMatch?.[1]) return preMatch[1]
    return payload.slice(0, 180)
  }

  return fallbackMessage
}

const ProjectUsersPage = () => {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingLedger, setEditingLedger] = useState(null)
  const [roiInput, setRoiInput] = useState('')
  const [returnPeriodInput, setReturnPeriodInput] = useState('')
  const [savingRoi, setSavingRoi] = useState(false)
  const returnPeriodOptions = useMemo(() => getReturnPeriodOptions(), [])

  useEffect(() => {
    let mounted = true
    const fetchProject = async () => {
      try {
        setLoading(true)
        let data
        try {
          const res = await axios.get(`/project/${projectId}`)
          data = res.data
        } catch (err) {
          // Backward-compatible fallback when /project/:id is not available yet on the running backend
          if (err?.response?.status === 404) {
            const res = await axios.get('/project', { params: { page: 1, perPage: 500 } })
            data = (res?.data?.data || []).find((p) => String(p.id) === String(projectId))
            if (!data) {
              throw new Error('Project not found')
            }
          } else {
            throw err
          }
        }
        if (mounted) {
          setProject(data)
          setError('')
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Failed to load project users')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProject()

    return () => {
      mounted = false
    }
  }, [projectId])

  const rows = useMemo(() => project?.ledgers || [], [project])
  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}')
  const isAdmin = currentUser?.role === 'admin'

  const closeRoiModal = (force = false) => {
    if (savingRoi && !force) return
    setEditingLedger(null)
    setRoiInput('')
    setReturnPeriodInput('')
  }

  const openRoiModal = ledger => {
    setEditingLedger(ledger)
    setRoiInput(String(ledger?.roi ?? ''))
    setReturnPeriodInput(
      String(ledger?.returnPeriod || returnPeriodOptions?.[0]?.value || 'annual')
    )
  }

  const saveRoi = async () => {
    if (!editingLedger || !project?.id) return

    const roiValue = Number(roiInput)
    if (!Number.isFinite(roiValue)) {
      toast.error('ROI must be a valid number')
      return
    }

    const minRoi = Number(project?.minROI)
    const maxRoi = Number(project?.maxROI)
    if (Number.isFinite(minRoi) && Number.isFinite(maxRoi) && (roiValue < minRoi || roiValue > maxRoi)) {
      toast.error(`ROI must be between ${minRoi} and ${maxRoi}`)
      return
    }

    if (!returnPeriodOptions.some(option => option.value === returnPeriodInput)) {
      toast.error('Please select a valid return period')
      return
    }

    setSavingRoi(true)
    try {
      const { data: updatedLedger } = await axios.put(
        `/project/${project.id}/ledgers/${editingLedger.id}/roi`,
        { roi: roiValue, returnPeriod: returnPeriodInput }
      )

      setProject(prev => {
        if (!prev) return prev
        const updatedLedgers = (prev.ledgers || []).map(ledger =>
          ledger.id === editingLedger.id
            ? { ...ledger, roi: updatedLedger.roi, returnPeriod: updatedLedger.returnPeriod }
            : ledger
        )
        return { ...prev, ledgers: updatedLedgers }
      })

      toast.success('ROI and return period updated successfully')
      closeRoiModal(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update ROI and return period'))
    } finally {
      setSavingRoi(false)
    }
  }

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='d-flex align-items-center justify-content-between'>
        <div>
          <CardTitle tag='h4' className='mb-0'>
            {project?.name || 'Project'} - Assigned Users
          </CardTitle>
        </div>
        <Button tag={Link} to='/projects' color='secondary' outline>
          Back
        </Button>
      </CardHeader>
      <CardBody>
        {loading && <p className='mb-0'>Loading project users...</p>}
        {!loading && error && <p className='mb-0 text-danger'>{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className='mb-0'>No users assigned to this project yet.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <Table responsive bordered hover className='project-users-table'>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>ROI</th>
                <th>Return Period</th>
                <th>Investment</th>
                <th>Returns</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ledger) => (
                <tr key={ledger.id}>
                  <td>{ledger?.User?.name || 'N/A'}</td>
                  <td>{ledger?.User?.email || 'N/A'}</td>
                  <td>{ledger?.roi ?? 'N/A'}</td>
                  <td>{ledger?.returnPeriod || 'N/A'}</td>
                  <td>{ledger?.investment ?? 0}</td>
                  <td>{ledger?.returns ?? 0}</td>
                  <td>
                    <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
                      <Button
                        size='sm'
                        color='primary'
                        tag={Link}
                        to={`/transactions?userId=${ledger.UserId}&projectId=${project?.id}&includeAdmin=1`}
                      >
                        View Transactions
                      </Button>
                      {isAdmin && (
                        <Button
                          size='sm'
                          color='warning'
                          outline
                          onClick={() => openRoiModal(ledger)}
                        >
                          Edit ROI / Period
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>

      <Modal isOpen={Boolean(editingLedger)} toggle={closeRoiModal}>
        <ModalHeader toggle={closeRoiModal}>Update ROI and Return Period</ModalHeader>
        <ModalBody>
          <div className='mb-1'>
            <div className='small text-muted mb-50'>
              User: {editingLedger?.User?.name || 'N/A'}
            </div>
            <div className='small text-muted mb-1'>
              Allowed range: {project?.minROI} - {project?.maxROI}
            </div>
            <Label className='form-label' for='project-user-roi'>ROI</Label>
            <Input
              id='project-user-roi'
              type='number'
              step='0.01'
              value={roiInput}
              onChange={e => setRoiInput(e.target.value)}
              disabled={savingRoi}
            />
            <Label className='form-label mt-1' for='project-user-return-period'>Return Period</Label>
            <Input
              id='project-user-return-period'
              type='select'
              value={returnPeriodInput}
              onChange={e => setReturnPeriodInput(e.target.value)}
              disabled={savingRoi}
            >
              {returnPeriodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' outline onClick={closeRoiModal} disabled={savingRoi}>
            Cancel
          </Button>
          <Button color='primary' onClick={saveRoi} disabled={savingRoi}>
            {savingRoi ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

export default ProjectUsersPage
