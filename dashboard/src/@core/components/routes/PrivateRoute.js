// ** React Imports
import { Navigate } from 'react-router-dom'
import { useContext, Suspense } from 'react'

// ** Context Imports
import { AbilityContext } from '@src/utility/context/Can'

// ** Spinner Import
import Spinner from '../spinner/Loading-spinner'
import { canAccessModule, isPrimaryAdmin } from '@src/utility/moduleAccess'
import { getHomeRouteForLoggedInUser } from '@src/utility/Utils'

const PrivateRoute = ({ children, route }) => {
  // ** Hooks & Vars
  const user = JSON.parse(localStorage.getItem('userData'))
  if (route) {
    let action = null
    let resource = null
    let restrictedRoute = false

    if (route.meta) {
      action = route.meta.action
      resource = route.meta.resource
      restrictedRoute = route.meta.restricted
    }
    
    if (!user) 
      return <Navigate to='/login' />

    if (user?.requiresPasswordChange && route?.path !== '/force-password-reset') {
      return <Navigate to='/force-password-reset' replace />
    }

    if (!user?.requiresPasswordChange && route?.path === '/force-password-reset') {
      return <Navigate to={getHomeRouteForLoggedInUser(user)} replace />
    }

    if (route?.meta?.primaryAdminOnly && !isPrimaryAdmin(user)) {
      return <Navigate to='/auth/not-auth' replace />
    }

    if (route?.meta?.module && !canAccessModule(user, route.meta.module)) {
      return <Navigate to='/auth/not-auth' replace />
    }
  }

  return <Suspense fallback={<Spinner className='content-loader' />}>{children}</Suspense>
}

export default PrivateRoute
