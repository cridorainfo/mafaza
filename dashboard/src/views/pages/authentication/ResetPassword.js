import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import { Button, Card, CardBody, CardText, CardTitle, Form, FormFeedback } from 'reactstrap'
import InputPasswordToggle from '@components/input-password-toggle'
import toast from 'react-hot-toast'
import '@styles/react/pages/page-authentication.scss'

const defaultValues = {
  newPassword: '',
  confirmPassword: ''
}

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams])

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = async values => {
    if (!token) {
      setError('newPassword', { type: 'manual', message: 'Invalid or expired reset link' })
      return
    }

    if (!values.newPassword) {
      setError('newPassword', { type: 'manual', message: 'New password is required' })
      return
    }

    if (!values.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Please confirm password' })
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
      const { data } = await axios.post('/auth/reset-password', {
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      })
      toast.success(data?.message || 'Password reset successful')
      navigate('/login', { replace: true })
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to reset password'
      setError('newPassword', { type: 'manual', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='auth-wrapper auth-basic px-2'>
      <div className='auth-inner my-2'>
        <Card className='mb-0'>
          <CardBody>
            <CardTitle tag='h4' className='mb-1'>Reset Password</CardTitle>
            <CardText className='mb-2'>
              Set a new password for your account.
            </CardText>
            {!token ? (
              <CardText className='text-danger'>
                Invalid or expired reset link. Please request a new one.
              </CardText>
            ) : null}
            <Form onSubmit={handleSubmit(onSubmit)}>
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
                {errors.newPassword ? <FormFeedback className='d-block'>{errors.newPassword.message}</FormFeedback> : null}
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
                {errors.confirmPassword ? <FormFeedback className='d-block'>{errors.confirmPassword.message}</FormFeedback> : null}
              </div>

              <Button color='primary' block disabled={submitting || !token}>
                {submitting ? 'Saving...' : 'Reset Password'}
              </Button>
              <p className='text-center mt-2 mb-0'>
                <Link to='/login'>Back to login</Link>
              </p>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword
