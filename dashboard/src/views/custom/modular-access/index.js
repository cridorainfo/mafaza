import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Input, Label, Row, Spinner, Table } from 'reactstrap'

const MODULE_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'ledger', label: 'User Ledger' },
  { key: 'projects', label: 'Projects' }
]

const initialModules = {
  dashboard: false,
  users: false,
  transactions: false,
  ledger: false,
  projects: false
}

const getInitialForm = () => ({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleName: '',
  status: 'verified',
  modules: { ...initialModules }
})

const normalizeModules = modules =>
  MODULE_OPTIONS.reduce((result, module) => {
    result[module.key] = Boolean(modules?.[module.key])
    return result
  }, {})

const formatDate = value => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const getApiErrorMessage = (error, fallbackMessage) => {
  const payload = error?.response?.data
  if (payload?.message) return payload.message

  if (typeof payload === 'string') {
    const preMatch = payload.match(/<pre>(.*?)<\/pre>/i)
    if (preMatch?.[1]) return preMatch[1]
    return payload.slice(0, 160)
  }

  return fallbackMessage
}

const ModularAccess = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [editingUserId, setEditingUserId] = useState(null)
  const [form, setForm] = useState(getInitialForm)

  const hasSelectedModule = useMemo(() => Object.values(form.modules).some(Boolean), [form.modules])
  const isEditMode = Boolean(editingUserId)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/modular-access/users')
      setUsers(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load modular access users'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const resetForm = () => {
    setForm(getInitialForm())
    setEditingUserId(null)
  }

  const onFieldChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onModuleChange = event => {
    const { name, checked } = event.target
    setForm(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [name]: checked
      }
    }))
  }

  const startEdit = user => {
    setEditingUserId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      roleName: user.roleName || '',
      status: user.status || 'verified',
      modules: normalizeModules(user.modules)
    })
  }

  const onSubmit = async event => {
    event.preventDefault()

    if (!hasSelectedModule) {
      toast.error('Select at least one module')
      return
    }

    if (!isEditMode && form.password !== form.confirmPassword) {
      toast.error('Password and confirm password must match')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        roleName: form.roleName.trim(),
        status: form.status,
        modules: normalizeModules(form.modules)
      }

      if (isEditMode) {
        await axios.put(`/modular-access/users/${editingUserId}`, payload)
        toast.success('Modular user updated')
      } else {
        await axios.post('/modular-access/users', {
          ...payload,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
        toast.success('Modular user created')
      }

      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(getApiErrorMessage(error, isEditMode ? 'Failed to update modular user' : 'Failed to create modular user'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async user => {
    const nextStatus = user.status === 'inactive' ? 'verified' : 'inactive'

    setStatusUpdatingId(user.id)
    try {
      await axios.put(`/user/${user.id}`, { status: nextStatus })
      toast.success(`User ${nextStatus === 'inactive' ? 'disabled' : 'activated'}`)
      fetchUsers()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update user status'))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <div className='app-user-list'>
      <Row>
        <Col md='5'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>{isEditMode ? 'Edit Modular User' : 'Create Modular User'}</CardTitle>
            </CardHeader>
            <CardBody>
              <Form onSubmit={onSubmit}>
                <div className='mb-1'>
                  <Label className='form-label' for='name'>Name</Label>
                  <Input id='name' name='name' value={form.name} onChange={onFieldChange} required />
                </div>
                <div className='mb-1'>
                  <Label className='form-label' for='email'>Email</Label>
                  <Input id='email' name='email' type='email' value={form.email} onChange={onFieldChange} required />
                </div>
                {!isEditMode && (
                  <>
                    <div className='mb-1'>
                      <Label className='form-label' for='password'>Password</Label>
                      <Input id='password' name='password' type='password' minLength={6} value={form.password} onChange={onFieldChange} required />
                    </div>
                    <div className='mb-1'>
                      <Label className='form-label' for='confirmPassword'>Confirm Password</Label>
                      <Input
                        id='confirmPassword'
                        name='confirmPassword'
                        type='password'
                        minLength={6}
                        value={form.confirmPassword}
                        onChange={onFieldChange}
                        required
                      />
                    </div>
                  </>
                )}
                <div className='mb-1'>
                  <Label className='form-label' for='roleName'>Role Name</Label>
                  <Input id='roleName' name='roleName' value={form.roleName} onChange={onFieldChange} placeholder='Ex: Operations Manager' required />
                </div>
                <div className='mb-1'>
                  <Label className='form-label' for='status'>Status</Label>
                  <Input id='status' name='status' type='select' value={form.status} onChange={onFieldChange}>
                    <option value='verified'>Verified</option>
                    <option value='inactive'>Inactive</option>
                  </Input>
                </div>

                <div className='mb-2'>
                  <Label className='form-label d-block'>Module Access</Label>
                  {MODULE_OPTIONS.map(module => (
                    <div key={module.key} className='form-check mb-50'>
                      <Input
                        id={`module-${module.key}`}
                        name={module.key}
                        type='checkbox'
                        checked={form.modules[module.key]}
                        onChange={onModuleChange}
                      />
                      <Label className='form-check-label' for={`module-${module.key}`}>
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div>
                  <Button color='primary' disabled={submitting}>
                    {submitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create User')}
                  </Button>
                  {isEditMode && (
                    <Button color='secondary' outline className='ms-1' type='button' onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col md='7'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Modular Users</CardTitle>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className='d-flex align-items-center'>
                  <Spinner size='sm' className='me-50' />
                  Loading users...
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role Name</th>
                      <th>Modules</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan='7' className='text-center'>No modular users found</td>
                      </tr>
                    )}
                    {users.map(user => {
                      const enabledModules = MODULE_OPTIONS
                        .filter(module => Boolean(user.modules?.[module.key]))
                        .map(module => module.label)

                      return (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.roleName || '-'}</td>
                          <td>
                            {enabledModules.length === 0 ? (
                              <span>-</span>
                            ) : (
                              enabledModules.map(module => (
                                <Badge key={`${user.id}-${module}`} color='light-primary' className='me-50 mb-50'>
                                  {module}
                                </Badge>
                              ))
                            )}
                          </td>
                          <td>
                            <Badge color={user.status === 'verified' ? 'light-success' : 'light-secondary'}>
                              {user.status}
                            </Badge>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <Button
                              size='sm'
                              color='primary'
                              outline
                              className='me-50'
                              onClick={() => startEdit(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              size='sm'
                              color={user.status === 'inactive' ? 'success' : 'secondary'}
                              outline
                              disabled={statusUpdatingId === user.id}
                              onClick={() => toggleUserStatus(user)}
                            >
                              {statusUpdatingId === user.id
                                ? 'Updating...'
                                : user.status === 'inactive'
                                  ? 'Activate'
                                  : 'Disable'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ModularAccess
