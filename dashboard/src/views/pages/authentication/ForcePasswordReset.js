import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { Button, Card, CardBody, CardText, CardTitle, Form, FormFeedback } from 'reactstrap'
import InputPasswordToggle from '@components/input-password-toggle'
import { getHomeRouteForLoggedInUser } from '@utils'

const defaultValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

const ForcePasswordReset = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = async values => {
    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
      if (!values.currentPassword) setError('currentPassword', { type: 'manual', message: 'Current password is required' })
      if (!values.newPassword) setError('newPassword', { type: 'manual', message: 'New password is required' })
      if (!values.confirmPassword) setError('confirmPassword', { type: 'manual', message: 'Please confirm password' })
      return
    }

    if (values.newPassword.length < 6) {
      setError('newPassword', { type: 'manual', message: 'New password must be at least 6 characters' })
      return
    }

    if (values.newPassword !== values.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' })
      return
    }

    setSubmitting(true)
    try {
      const { data } = await axios.post('/auth/force-password-reset', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      })

      const existing = JSON.parse(localStorage.getItem('userData') || '{}')
      const updatedUser = {
        ...existing,
        ...(data?.user || {}),
        requiresPasswordChange: false
      }
      localStorage.setItem('userData', JSON.stringify(updatedUser))

      toast.success('Password updated successfully')
      navigate(getHomeRouteForLoggedInUser(updatedUser), { replace: true })
    } catch (error) {
      setError('currentPassword', {
        type: 'manual',
        message: error?.response?.data?.message || 'Failed to update password'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='auth-wrapper auth-basic px-2'>
      <div className='auth-inner my-2'>
        <Card className='mb-0'>
          <CardBody>
            <CardTitle tag='h4' className='mb-1'>
              Set New Password
            </CardTitle>
            <CardText className='mb-2'>
              Your account is using a temporary password. Set a new password to continue.
            </CardText>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Controller
                  control={control}
                  name='currentPassword'
                  render={({ field }) => (
                    <InputPasswordToggle
                      label='Current Password'
                      htmlFor='currentPassword'
                      className='input-group-merge'
                      invalid={Boolean(errors.currentPassword)}
                      {...field}
                    />
                  )}
                />
                {errors.currentPassword && (
                  <FormFeedback className='d-block'>{errors.currentPassword.message}</FormFeedback>
                )}
              </div>

              <div className='mb-1'>
                <Controller
                  control={control}
                  name='newPassword'
                  render={({ field }) => (
                    <InputPasswordToggle
                      label='New Password'
                      htmlFor='newPassword'
                      className='input-group-merge'
                      invalid={Boolean(errors.newPassword)}
                      {...field}
                    />
                  )}
                />
                {errors.newPassword && (
                  <FormFeedback className='d-block'>{errors.newPassword.message}</FormFeedback>
                )}
              </div>

              <div className='mb-2'>
                <Controller
                  control={control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <InputPasswordToggle
                      label='Confirm New Password'
                      htmlFor='confirmPassword'
                      className='input-group-merge'
                      invalid={Boolean(errors.confirmPassword)}
                      {...field}
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <FormFeedback className='d-block'>{errors.confirmPassword.message}</FormFeedback>
                )}
              </div>

              <Button color='primary' block disabled={submitting}>
                {submitting ? 'Saving...' : 'Save New Password'}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ForcePasswordReset
