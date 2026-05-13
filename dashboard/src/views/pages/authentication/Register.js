// ** React Imports
import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Custom Hooks
import useJwt from '@src/auth/jwt/useJwt'

// ** Store & Actions
import { useDispatch } from 'react-redux'

// ** Third Party Components
import { useForm, Controller } from 'react-hook-form'

// ** Context
import { AbilityContext } from '@src/utility/context/Can'

// ** Custom Components
import InputPasswordToggle from '@components/input-password-toggle'

// ** Reactstrap Imports
import { Card, CardBody, CardTitle, CardText, Label, Button, Form, Input, FormFeedback } from 'reactstrap'

// ** Styles
import '@styles/react/pages/page-authentication.scss'

// ** Utils
import { selectThemeColors } from '@utils'

const defaultValues = {
  email: '',
  phoneNumber: '',
  name: '',
  address: '',
  password: '',
  confirmPassword: '',
}

const Register = () => {
  
  // ** Hooks
  const ability = useContext(AbilityContext)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })


  const onSubmit = data => {
    const tempData = { ...data }
    if (Object.values(tempData).every(field => field.length > 0)) {
      const toastId = toast.loading("Loading ...")
      useJwt
        .register(data)
        .then(res => {
          console.log("here2")
          toast.success(res.data.message, { id: toastId })
        })
        .catch(err => {
          const errorMessage = err?.response?.data?.message || "An unexpected error occurred. Please try again."
          toast.error(errorMessage, { id: toastId })
        })
    } else {
      for (const key in data) {
        if (data[key].length === 0) {
          setError(key, {
            type: 'manual',
            message: `Please enter a valid ${key}`
          })
        }
      }
    }
  }

  return (
    <div className='auth-wrapper auth-basic px-2'>
      <div className='auth-inner my-2'>
        <Card className='mb-0'>
          <CardBody>
            <CardTitle tag='h4' className='mb-1'>
              Adventure starts here 🚀
            </CardTitle>
            <CardText className='mb-2'>Join Mafaza today!</CardText>
            <Form action='/' className='auth-register-form mt-2' onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Label className='form-label' for='name'>
                  Full Name
                </Label>
                <Controller
                  id='name'
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input placeholder='Enter your full name' invalid={errors.name && true} {...field} />
                  )}
                />
                {errors.name ? <FormFeedback>{errors.name.message}</FormFeedback> : null}
              </div>
              <div className='mb-1'>
                <Label className='form-label' for='phoneNumber'>
                  Phone Number
                </Label>
                <Controller
                  id='phoneNumber'
                  name='phoneNumber'
                  control={control}
                  render={({ field }) => (
                    <Input type='text' minLength={8} placeholder='71718914' invalid={errors.phoneNumber && true} {...field} />
                  )}
                />
                {errors.phoneNumber ? <FormFeedback>{errors.phoneNumber.message}</FormFeedback> : null}
              </div>
              <div className='mb-1'>
                <Label className='form-label' for='email'>
                  Email
                </Label>
                <Controller
                  id='email'
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input type='email' placeholder='john@example.com' invalid={errors.email && true} {...field} />
                  )}
                />
                {errors.email ? <FormFeedback>{errors.email.message}</FormFeedback> : null}
              </div>
              <div className='mb-1'>
                <Label className='form-label' for='address'>
                  Address
                </Label>
                <Controller
                  id='address'
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <Input placeholder='Enter your address' invalid={errors.address && true} {...field} />
                  )}
                />
                {errors.address ? <FormFeedback>{errors.address.message}</FormFeedback> : null}
              </div>
              <div className='mb-1'>
                <Label className='form-label' for='password'>
                  Password
                </Label>
                <Controller
                  id='password'
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle className='input-group-merge' invalid={errors.password && true} {...field} />
                  )}
                />
              </div>
              <div className='mb-1'>
                <Label className='form-label' for='confirmPassword'>
                  Confirm Password
                </Label>
                <Controller
                  id='confirmPassword'
                  name='confirmPassword'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle className='input-group-merge' invalid={errors.confirmPassword && true} {...field} />
                  )}
                />
              </div>
              <Button type='submit' block color='primary'>
                Sign up
              </Button>
            </Form>
            <p className='text-center mt-2'>
              <span className='me-25'>Already have an account?</span>
              <Link to='/login'>
                <span>Sign in instead</span>
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Register
