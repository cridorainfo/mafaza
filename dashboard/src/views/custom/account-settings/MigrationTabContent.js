import { useMemo, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Input,
  Label,
  Row,
  UncontrolledTooltip
} from 'reactstrap'
import { Info } from 'react-feather'

const TEMPLATE_USERS = [
  {
    email: 'investor@example.com',
    name: 'Investor One',
    phoneNumber: '+971500000000',
    address: 'Dubai, UAE',
    country: 'United Arab Emirates',
    role: 'user',
    status: 'verified'
  }
]

const TEMPLATE_PROJECTS = [
  {
    project_code: 'GOLDEN-HILLS-001',
    name: 'Golden Hills',
    totalInvestement: 500000,
    minROI: 8,
    maxROI: 12,
    description: 'Sample project',
    isActive: true
  }
]

const TEMPLATE_ASSIGNMENTS = [
  {
    user_email: 'investor@example.com',
    project_code: 'GOLDEN-HILLS-001',
    roi: 10,
    returnPeriod: 'annual',
    date: new Date().toISOString().slice(0, 10),
    investment: 10000,
    withdrawal: 200,
    withdrawal_date: ''
  }
]

const TEMPLATE_NOTES = [
  ['Read this before importing'],
  ['1) Keep exact sheet names: users, projects, assignments'],
  ['2) users.email is treated as the unique user key'],
  ['3) assignments must reference users by user_email and projects by project_code'],
  ['4) assignments: investment anchor date, roi & returnPeriod create scheduled returns to today as transactions; cumulative return-withdrawals in withdrawal (+ optional withdrawal_date for passbook ordering)'],
  ['5) returnPeriod supports annual, semi-annual, quarterly, testing'],
  ['6) Omit date on an assignment row to anchor accruals at import time'],
  ['7) New users get auto-generated temporary passwords and will be forced to reset on first login']
]

const normalizeRows = rows =>
  rows.map(row =>
    Object.keys(row || {}).reduce((result, key) => {
      const normalizedKey = String(key || '').trim()
      result[normalizedKey] = row[key]
      return result
    }, {})
  )

const getSheetRows = (workbook, sheetName) => {
  const match = workbook.SheetNames.find(name => name.toLowerCase() === sheetName.toLowerCase())
  if (!match) return []
  return normalizeRows(
    XLSX.utils.sheet_to_json(workbook.Sheets[match], { defval: '', cellDates: true })
  )
}

const buildWorkbookDownload = (sheetMap, fileName) => {
  const workbook = XLSX.utils.book_new()
  Object.entries(sheetMap).forEach(([sheetName, rows]) => {
    const worksheet = Array.isArray(rows[0])
      ? XLSX.utils.aoa_to_sheet(rows)
      : XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })
  XLSX.writeFile(workbook, fileName)
}

const downloadCredentialsCsv = (csvText, fileName) => {
  if (!csvText) return
  const blob = new Blob([`\uFEFF${csvText}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const MigrationTabContent = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [lastImportResult, setLastImportResult] = useState(null)

  const selectedFileName = useMemo(() => selectedFile?.name || '', [selectedFile])

  const handleTemplateDownload = async () => {
    setDownloadingTemplate(true)
    try {
      const { data } = await axios.get('/migration/template')
      buildWorkbookDownload(
        {
          users: data?.users?.length ? data.users : TEMPLATE_USERS,
          projects: data?.projects?.length ? data.projects : TEMPLATE_PROJECTS,
          assignments: data?.assignments?.length ? data.assignments : TEMPLATE_ASSIGNMENTS,
          readme: (data?.notes || TEMPLATE_NOTES.map(item => item[0])).map(note => [note])
        },
        `mafaza-migration-template-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to download template')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleExportDownload = async () => {
    setExporting(true)
    try {
      const { data } = await axios.get('/migration/export')
      buildWorkbookDownload(
        {
          users: data?.users || [],
          projects: data?.projects || [],
          assignments: data?.assignments || [],
          transactions: data?.transactions || [],
          readme: [
            ['Mafaza Export'],
            [`Generated At: ${data?.generatedAt || new Date().toISOString()}`],
            ['Import currently supports users, projects, assignments.'],
            ['Transactions are exported as backup/reference only.']
          ]
        },
        `mafaza-full-export-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export current data')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a migration file first')
      return
    }

    setImporting(true)
    const toastId = toast.loading('Importing migration file...')

    try {
      const bytes = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(bytes, { type: 'array' })

      const payload = {
        users: getSheetRows(workbook, 'users'),
        projects: getSheetRows(workbook, 'projects'),
        assignments: getSheetRows(workbook, 'assignments'),
        sendEmails: true
      }

      const { data } = await axios.post('/migration/import', payload)
      setLastImportResult(data)
      toast.success('Migration import completed', { id: toastId })

      if (data?.credentialsCsv) {
        downloadCredentialsCsv(
          data.credentialsCsv,
          `generated-credentials-${new Date().toISOString().slice(0, 10)}.csv`
        )
      }
    } catch (error) {
      const responseMessage = error?.response?.data?.message
      const details = error?.response?.data?.details || []
      const firstDetail = details[0]
      toast.error(firstDetail || responseMessage || 'Migration import failed', { id: toastId })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <CardTitle tag='h4'>Data Migration</CardTitle>
      </CardHeader>
      <CardBody className='pt-2'>
        <Alert color='info'>
          <div className='fw-bold mb-50'>How this works</div>
          <div>1. Download template and prepare users, projects, assignments.</div>
          <div>2. Each assignment anchors investment on sheet date (or today if omitted), accrues all scheduled returns until import time into the ledger, and records cumulative return-withdrawals on the ledger and as a withdrawal line (optional withdrawal_date).</div>
          <div>3. New users receive temporary passwords by email and must reset on first login.</div>
        </Alert>

        <Row className='gy-2'>
          <Col md='6' xs='12'>
            <div className='d-flex align-items-center mb-50'>
              <Label className='mb-0 me-50 fw-bold'>Step 1: Template</Label>
              <Info id='migration-template-tip' size={15} className='text-primary' />
              <UncontrolledTooltip placement='right' target='migration-template-tip'>
                Template includes sample rows and required columns.
              </UncontrolledTooltip>
            </div>
            <Button
              color='primary'
              onClick={handleTemplateDownload}
              disabled={downloadingTemplate}
            >
              {downloadingTemplate ? 'Preparing Template...' : 'Download Template'}
            </Button>
          </Col>

          <Col md='6' xs='12'>
            <div className='d-flex align-items-center mb-50'>
              <Label className='mb-0 me-50 fw-bold'>Step 2: Export Current Data</Label>
              <Info id='migration-export-tip' size={15} className='text-primary' />
              <UncontrolledTooltip placement='right' target='migration-export-tip'>
                Download a full backup before importing anything.
              </UncontrolledTooltip>
            </div>
            <Button
              color='secondary'
              outline
              onClick={handleExportDownload}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Download Full Export'}
            </Button>
          </Col>

          <Col xs='12'>
            <div className='d-flex align-items-center mb-50'>
              <Label className='mb-0 me-50 fw-bold'>Step 3: Upload & Import</Label>
              <Info id='migration-import-tip' size={15} className='text-primary' />
              <UncontrolledTooltip placement='right' target='migration-import-tip'>
                Required sheets: users, projects, assignments.
              </UncontrolledTooltip>
            </div>

            <Input
              type='file'
              accept='.xlsx,.xls'
              onChange={event => setSelectedFile(event.target.files?.[0] || null)}
            />
            {selectedFileName ? (
              <div className='mt-50'>
                Selected file: <Badge color='light-primary'>{selectedFileName}</Badge>
              </div>
            ) : null}

            <div className='mt-1'>
              <Button color='success' onClick={handleImport} disabled={!selectedFile || importing}>
                {importing ? 'Importing...' : 'Run Import'}
              </Button>
            </div>
          </Col>
        </Row>

        {lastImportResult?.summary ? (
          <Alert color='success' className='mt-2 mb-0'>
            <div className='fw-bold mb-50'>Last Import Summary</div>
            <div>Users: +{lastImportResult.summary.usersCreated} created, {lastImportResult.summary.usersUpdated} updated</div>
            <div>Projects: +{lastImportResult.summary.projectsCreated} created, {lastImportResult.summary.projectsUpdated} updated</div>
            <div>Assignments: +{lastImportResult.summary.assignmentsCreated} created, {lastImportResult.summary.assignmentsUpdated} updated</div>
            <div>Credentials generated: {lastImportResult.summary.generatedCredentials}</div>
            <div>Emails sent: {lastImportResult.summary.emailsSent}</div>
            {lastImportResult.summary.emailFailures > 0 ? (
              <div className='text-warning'>Email failures: {lastImportResult.summary.emailFailures}</div>
            ) : null}
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  )
}

export default MigrationTabContent
