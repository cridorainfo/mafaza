// ** React Import
import { useState, useEffect, useMemo } from 'react'

// ** Custom Components
import Sidebar from '@components/sidebar'
import Select from 'react-select'
import classnames from 'classnames'
import Flatpickr from 'react-flatpickr'
import '@styles/react/libs/flatpickr/flatpickr.scss'

// ** Third Party Components
import { useForm, Controller } from 'react-hook-form'
import { selectThemeColors } from '@utils'

// ** Reactstrap Imports
import { Button, Label, Form, Input } from 'reactstrap'
import toast from 'react-hot-toast'
import axios from 'axios'

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux'
import { addTransaction } from './store'
import { getAllData as getAllUsers } from '../users/store'
import { getAllData as getAllProjects } from '../projects/store'


const defaultValues = {
  date: new Date(),
  amount: '',
  narration: '',
  transactionType: '',
  user: '',
  project: ''
}


const checkIsValid = data => {
  return Object.values(data).every(field => field !== null)
}

const AddTransaction = ({ open, toggleSidebar }) => {
  // ** States
  const [data, setData] = useState(null)
  const [UserId, setUserId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState(0)
  const [transactionTypeValue, setTransactionTypeValue] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  // ** Store Vars
  const dispatch = useDispatch()

  const { allData: users } = useSelector(state => state.users)
  const { allData: projects } = useSelector(state => state.projects)
  const currentUser = JSON.parse(localStorage.getItem('userData'))
  const assignableUsers = useMemo(() => {
    const blockedRoles = new Set(['admin', 'super_admin', 'accountant'])
    const blockedStatuses = new Set(['inactive', 'disabled', 'pending', 'rejected'])

    return (users || []).filter(user => {
      const role = String(user?.role || '').toLowerCase()
      const status = String(user?.status || '').toLowerCase()

      if (blockedRoles.has(role)) return false
      if (blockedStatuses.has(status)) return false
      return true
    })
  }, [users])

  // ** Vars
  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const successCb = () =>{
    reset(defaultValues)
    setSelectedProjectId(null)
    setSelectedFile(null)
    setTransactionTypeValue(null)
    toggleSidebar()
  }

  const selectedProject = useMemo(
    () => projects?.find(project => Number(project.id) === Number(selectedProjectId)),
    [projects, selectedProjectId]
  )

  const effectiveUserId = UserId || currentUser?.id

  const baseWithdrawableAmount = useMemo(() => {
    if (!selectedProject || !effectiveUserId) return 0
    const ledger = selectedProject.ledgers?.find(ledgerItem => Number(ledgerItem.UserId) === Number(effectiveUserId))
    if (!ledger) return 0

    const returns = Number(ledger.returns) || 0
    const withdrawal = Number(ledger.withdrawal) || 0
    return Math.max(returns - withdrawal, 0)
  }, [selectedProject, effectiveUserId])

  const withdrawableAmount = useMemo(() => {
    if (transactionTypeValue !== 'withdrawal') return baseWithdrawableAmount
    return Math.max(baseWithdrawableAmount - pendingWithdrawalAmount, 0)
  }, [baseWithdrawableAmount, pendingWithdrawalAmount, transactionTypeValue])
  
  // ** Function to handle form submit
  const onSubmit = data => {
    setData(data)

    if (data?.transactionType?.value === 'withdrawal') {
      const requestedAmount = Number(data?.amount) || 0
      if (requestedAmount > withdrawableAmount) {
        toast.error(`You can withdraw up to ${withdrawableAmount.toFixed(2)} AED from this project's returns.`)
        return
      }
    }

    if (checkIsValid(data)) {
      dispatch(
        addTransaction({
          ...data,
          file: transactionTypeValue === 'withdrawal' ? null : selectedFile,
          UserId: data.user?.value || currentUser?.id,
          ProjectId: data.project.value,
          type: data.transactionType.value,
          date: data.date[0] || new Date(),
          successCb
        })
      )
    } else {
      for (const key in data) {
        if (data[key] !== null) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

  const handleSidebarClosed = () => {

  }
  useEffect(() => {
    dispatch(getAllUsers())
    dispatch(getAllProjects())
  }, [dispatch])

  useEffect(() => {
    if (!UserId) return
    const exists = assignableUsers.some(user => Number(user.id) === Number(UserId))
    if (!exists) {
      setUserId(null)
      setSelectedProjectId(null)
      setValue('user', null)
      setValue('project', null)
    }
  }, [UserId, assignableUsers, setValue])

  useEffect(() => {
    let ignore = false

    const loadPendingWithdrawalAmount = async () => {
      if (transactionTypeValue !== 'withdrawal' || !selectedProjectId || !effectiveUserId) {
        if (!ignore) setPendingWithdrawalAmount(0)
        return
      }

      try {
        let page = 1
        let totalPages = 1
        let reservedAmount = 0

        while (page <= totalPages) {
          const response = await axios.get('/transaction', {
            params: {
              UserId: effectiveUserId,
              ProjectId: selectedProjectId,
              status: 'pending',
              type: 'withdrawal',
              page,
              perPage: 100
            }
          })

          const payload = response?.data || {}
          const rows = Array.isArray(payload.data) ? payload.data : []
          reservedAmount += rows.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0)
          totalPages = Number(payload.totalPages) || 1
          page += 1
        }

        if (!ignore) setPendingWithdrawalAmount(reservedAmount)
      } catch (error) {
        if (!ignore) setPendingWithdrawalAmount(0)
      }
    }

    loadPendingWithdrawalAmount()

    return () => {
      ignore = true
    }
  }, [transactionTypeValue, selectedProjectId, effectiveUserId])

  const transactionsOptions = [
    { value: 'investment', label: 'Investment' },
    { value: 'withdrawal', label: 'Withdrawal' },
    ...(currentUser?.role === "super_admin" ? [{ value: 'investment-withdrawal', label: 'Investment Withdrawal' }] : [])
  ]

  return (
    <Sidebar
      size='lg'
      open={open}
      title='Add a transaction'
      headerClassName='mb-1'
      contentClassName='pt-0'
      toggleSidebar={toggleSidebar}
      onClosed={handleSidebarClosed}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        {["admin", "super_admin", "accountant"].includes(currentUser?.role) && <div className='mb-1'>
            <Label className='form-label' for='name'>
              User <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='user'
              control={control}
              render={({ field }) => (
                <Select
                  isClearable={false}
                  classNamePrefix='select'
                options={assignableUsers.map(user => ({ label: user.name, value: user.id }))}
                theme={selectThemeColors}
                className={classnames('react-select', { 'is-invalid': data !== null && data.country === null })}
                  
                {...field}
                onChange={val => {
                    field.onChange(val)
                    setUserId(val?.value)
                    setSelectedProjectId(null)
                    setValue('project', null)
                  }}
                />
              )}
            />
        </div>}
        <div className='mb-1'>
          <Label className='form-label' for='amount'>
            Amount <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='amount'
            control={control}
            render={({ field }) => (
              <Input
                id='amount'
                type='number'
                min={1}
                max={transactionTypeValue === 'withdrawal' ? withdrawableAmount : undefined}
                placeholder='Ex: 100'
                invalid={errors.amount}
                required
                {...field}
              />
            )}
          />
          {transactionTypeValue === 'withdrawal' && selectedProjectId ? (
            <>
              <small className='text-muted d-block'>
                Available to withdraw: <strong>{withdrawableAmount.toFixed(2)} AED</strong>
              </small>
              {pendingWithdrawalAmount > 0 ? (
                <small className='text-warning d-block'>
                  Pending withdrawals reserved: <strong>{pendingWithdrawalAmount.toFixed(2)} AED</strong>
                </small>
              ) : null}
            </>
          ) : null}
        </div>
        <div className='mb-1'>
          <Label className='form-label' for='date'>
            Date <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='date'
            control={control}
            render={({ field }) => (
              <Flatpickr className='form-control' id='default-picker' 
              required invalid={errors.date} {...field}/>
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='name'>
            Project <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='project'
            control={control}
            render={({ field }) => (
              <Select
                isClearable={false}
                classNamePrefix='select'
                options={projects?.filter(p => (p.ledgers || []).map(l => l.UserId).includes(UserId || currentUser.id))
                  .map(project => ({ label: project.name, value: project.id }))}
                theme={selectThemeColors}
                className={classnames('react-select', { 'is-invalid': data !== null && data.country === null })}
                {...field}
                onChange={val => {
                  field.onChange(val)
                  setSelectedProjectId(val?.value || null)
                }}
              />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='name'>
            Transaction Type <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='transactionType'
            control={control}
            render={({ field }) => (
              <Select
                isClearable={false}
                classNamePrefix='select'
                options={transactionsOptions}
                theme={selectThemeColors}
                className={classnames('react-select', { 'is-invalid': data !== null && data.country === null })}
                {...field}
                onChange={val => {
                  field.onChange(val)
                  setTransactionTypeValue(val?.value)
                  if (val?.value === 'withdrawal') {
                    setSelectedFile(null)
                  }
                }}
              />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='narration'>
            Narration <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='narration'
            control={control}
            render={({ field }) => (
              <Input id='narration' type='textarea' placeholder='Project narration' required invalid={errors.description} {...field} />
            )}
          />
        </div>

        {transactionTypeValue !== 'withdrawal' ? (
          <div className='mb-1'>
            <Label className='form-label' for='receipt'>
              Upload a Receipt {transactionTypeValue === "investment" && <span className='text-danger'>*</span>}
            </Label>
            <Input
              name='receipt'
              id='receipt'
              type='file'
              accept='image/*,application/pdf'
              onChange={e => setSelectedFile(e.target.files[0])}
              required={transactionTypeValue === "investment"}
            />
          </div>
        ) : null}

        <Button type='submit' className='me-1' color='primary'>
          Submit
        </Button>
        <Button type='reset' color='secondary' outline onClick={toggleSidebar}>
          Cancel
        </Button>
      </Form>
    </Sidebar>
  )
}

export default AddTransaction
