// ** React Imports
import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import ComingSoon from '../../views/pages/misc/ComingSoon'
import HomePage from '../../views/pages/home/HomePage'

const Login = lazy(() => import('../../views/pages/authentication/Login'))
const Register = lazy(() => import('../../views/pages/authentication/Register'))
const ForgotPassword = lazy(() => import('../../views/pages/authentication/ForgotPassword'))
const ResetPassword = lazy(() => import('../../views/pages/authentication/ResetPassword'))

const AuthenticationRoutes = [
  {
    index: true,
    element: <HomePage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/landing',
    element: <Navigate to='/' replace />,
    meta: {
      layout: 'blank',
      publicRoute: true
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
