// ** Router imports
import { lazy, useEffect } from 'react'

// ** Router imports
import { useRoutes } from 'react-router-dom'

// ** Layouts
import BlankLayout from '@layouts/BlankLayout'

// ** Hooks Imports
import { useLayout } from '@hooks/useLayout'

// ** GetRoutes
import { getRoutes } from './routes'

// ** Components
const Error = lazy(() => import('../views/pages/misc/Error'))
const Login = lazy(() => import('../views/pages/authentication/Login'))
const NotAuthorized = lazy(() => import('../views/pages/misc/NotAuthorized'))

const Router = () => {
  // ** Hooks
  const { layout } = useLayout()
  
  const allRoutes = getRoutes(layout)

  const routes = useRoutes([
    {
      path: '/auth/not-auth',
      element: <BlankLayout />,
      children: [{ path: '/auth/not-auth', element: <NotAuthorized /> }]
    },
    ...allRoutes,
    {
      path: '*',
      element: <BlankLayout />,
      children: [{ path: '*', element: <Error /> }]
    }
  ])

  return routes
}

export default Router
