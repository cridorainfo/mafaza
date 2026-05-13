// ** React Imports
import { lazy } from 'react'
import ComingSoon from '../../views/pages/misc/ComingSoon'
import HomePage from '../../views/pages/home/HomePage'

const Login = lazy(() => import('../../views/pages/authentication/Login'))
const Register = lazy(() => import('../../views/pages/authentication/Register'))
const ForgotPassword = lazy(() => import('../../views/pages/authentication/ForgotPassword'))
const ResetPassword = lazy(() => import('../../views/pages/authentication/ResetPassword'))

const AuthenticationRoutes = [
  {
    path: '/landing',
    element: <HomePage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/login',
    element: <Login />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/register',
    element: <Register />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: false
    }
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: false
    }
  }
]

export default AuthenticationRoutes
