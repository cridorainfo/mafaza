import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import { Button, Card, CardBody, CardText, CardTitle, Form, Input, Label, FormFeedback } from 'reactstrap'
import toast from 'react-hot-toast'
import '@styles/react/pages/page-authentication.scss'

const defaultValues = {
  email: ''
}

const ForgotPassword = () => {
  const [submitting, setSubmitting] = useState(false)
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = async values => {
    if (!values.email) {
      setError('email', { type: 'manual', message: 'Email is required' })
      return
    }

    setSubmitting(true)
    try {
      const { data } = await axios.post('/auth/forgot-password', { email: values.email })
      toast.success(data?.message || 'If that email exists, a reset link has been sent.')
    } catch (error) {
      setError('email', {
        type: 'manual',
        message: error?.response?.data?.message || 'Failed to request password reset'
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
            <CardTitle tag='h4' className='mb-1'>Forgot Password?</CardTitle>
            <CardText className='mb-2'>
              Enter your email address and we will send you a link to reset your password.
            </CardText>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Label className='form-label' for='email'>Email</Label>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='email'
                      type='email'
                      placeholder='john@example.com'
                      invalid={Boolean(errors.email)}
                      {...field}
                    />
                  )}
                />
                {errors.email ? <FormFeedback>{errors.email.message}</FormFeedback> : null}
              </div>
              <Button color='primary' block disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword
