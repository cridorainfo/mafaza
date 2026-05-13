// ** React Imports
import { Outlet } from 'react-router-dom'

// ** Core Layout Import
// !Do not remove the Layout import
import Layout from '@layouts/VerticalLayout'
import { getUserData } from '@utils'
import { canAccessModule, isPrimaryAdmin } from '@src/utility/moduleAccess'

// ** Menu Items Array
import navigation from '@src/navigation/vertical'

const VerticalLayout = props => {
  
  const user = getUserData()
  const filteredNavigation = navigation.filter(item => {
    if (item.primaryAdminOnly && !isPrimaryAdmin(user)) return false
    const hasRole = item.roles?.includes(user?.role)
    if (!hasRole) return false
    if (!item.moduleKey) return true
    return canAccessModule(user, item.moduleKey)
  })
  
  return (
    <Layout menuData={filteredNavigation} {...props}>
      <Outlet />
    </Layout>
  )
}

export default VerticalLayout
