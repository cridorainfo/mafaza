// ** React Imports
import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// ** Custom Hooks
import useJwt from '@src/auth/jwt/useJwt'

// ** Third Party Components
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { Coffee, X } from 'react-feather'
import { getHomeRouteForLoggedInUser } from '@utils'

// ** Actions
import { handleLogin } from '@store/authentication'

// ** Context
import { AbilityContext } from '@src/utility/context/Can'

// ** Custom Components
import Avatar from '@components/avatar'
import InputPasswordToggle from '@components/input-password-toggle'

// ** Reactstrap Imports
import {
  Form,
  Input,
  Label,
  Card,
  CardBody,
  Button,
  CardText,
  CardTitle,
  FormFeedback
} from 'reactstrap'

// ** Styles
import '@styles/react/pages/page-authentication.scss'

const ToastContent = ({ t, name, role }) => {
  return (
    <div className='d-flex'>
      <div className='me-1'>
        <Avatar size='sm' color='success' icon={<Coffee size={12} />} />
      </div>
      <div className='d-flex flex-column'>
        <div className='d-flex justify-content-between'>
          <h6>{name}</h6>
          <X size={12} className='cursor-pointer' onClick={() => toast.dismiss(t.id)} />
        </div>
        <span>You have successfully logged in. Now you can start to explore. Enjoy!</span>
      </div>
    </div>
  )
}

const defaultValues = {
  password: '',
  email: ''
}

const Login = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ability = useContext(AbilityContext)
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = data => {
    if (Object.values(data).every(field => field.length > 0)) {
      useJwt
        .login({ email: data.email, password: data.password })
        .then(res => {
          const requiresPasswordChange = Boolean(
            res?.data?.requiresPasswordChange || res?.data?.user?.requiresPasswordChange
          )
          const data = {
            ...res.data.user,
            requiresPasswordChange,
            accessToken: res.data.jwtToken,
            ability: [{ action: 'manage', subject: 'all' }]
          }
          dispatch(handleLogin(data))
          ability.update(data.ability)
          if (requiresPasswordChange) {
            navigate('/force-password-reset')
            return
          }

          navigate(getHomeRouteForLoggedInUser(data))
          toast(t => (
            <ToastContent t={t} role={'admin'} name={data.name} />
          ))
        })
        .catch(err => {
          const apiMessage = err?.response?.data?.message
          const fallback =
            err?.code === 'ERR_NETWORK' || err?.message === 'Network Error'
              ? 'Cannot reach the server. If production: set Railway APP_URL (or CORS_ORIGINS) to match this page’s URL exactly, including https.'
              : 'An error has occured, please try again!'
          setError('email', {
            type: 'manual',
            message: apiMessage || fallback
          })
        })
    } else {
      for (const key in data) {
        if (data[key].length === 0) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

  const user = JSON.parse(localStorage.getItem('userData'))
  if(user) {
    if (user.requiresPasswordChange) {
      navigate('/force-password-reset')
    } else {
      navigate(getHomeRouteForLoggedInUser(user))
    }
  }
  
  return (
    <div className='auth-wrapper auth-basic px-2'>
      <div className='auth-inner my-2'>
        <Card className='mb-0'>
          <CardBody>
            <Link className='brand-logo' to='/'>
              <h2 className='brand-text text-primary ms-1'>Mafaza Investments</h2>
            </Link>
            <CardTitle tag='h4' className='mb-1'>
              Welcome to Mafaza Investment LLC! 👋
            </CardTitle>
            <CardText className='mb-2'>
              Please sign in with your credentials to view your investment-related data.
            </CardText>
            <Form className='auth-login-form mt-2' onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Label className='form-label' for='login-email'>
                  Email
                </Label>
                <Controller
                  id='email'
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input
                      autoFocus
                      type='email'
                      placeholder='john@example.com'
                      invalid={errors.email && true}
                      {...field}
                    />
                  )}
                />
                {errors.email && <FormFeedback>{errors.email.message}</FormFeedback>}
              </div>
              <div className='mb-1'>
                <div className='d-flex justify-content-between'>
                  <Label className='form-label' for='login-password'>
                    Password
                  </Label>
                  <Link to='/forgot-password'>
                    <small>Forgot Password?</small>
                  </Link>
                </div>
                <Controller
                  id='password'
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle className='input-group-merge' invalid={errors.password && true} {...field} />
                  )}
                />
              </div>
              <div className='form-check mb-1'>
                <Input type='checkbox' id='remember-me' />
                <Label className='form-check-label' for='remember-me'>
                  Remember Me
                </Label>
              </div>
              <Button color='primary' block>
                Sign in
              </Button>
              <Button tag={Link} to='/' color='secondary' outline block className='mt-1'>
                Back to home
              </Button>
              <p className='text-center mt-2'>
              <span className='me-25'>Don't have an account?</span>
                <Link to='/register'>
                  <span>Sign up</span>
                </Link>
              </p>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Login
