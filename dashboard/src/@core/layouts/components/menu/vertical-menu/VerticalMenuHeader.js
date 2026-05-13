// ** React Imports
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

// ** Config
import themeConfig from '@configs/themeConfig'

// ** Utils
import { getUserData, getHomeRouteForLoggedInUser } from '@utils'

const VerticalMenuHeader = props => {
  // ** Props
  const { menuCollapsed, setGroupOpen, menuHover } = props

  // ** Vars
  const user = getUserData()

  // ** Reset open group
  useEffect(() => {
    if (!menuHover && menuCollapsed) setGroupOpen([])
  }, [menuHover, menuCollapsed])


  return (
    <div className='navbar-header'>
      <ul className='nav navbar-nav flex-row'>
        <li className='nav-item me-auto'>
          <NavLink to={user ? getHomeRouteForLoggedInUser(user.role) : '/'} className='navbar-brand'>
            {/* <h2 className='brand-text mb-0 ps-0'>{themeConfig.app.appName}</h2> */}
            <span className='brand-logo mb-2'>
              <img src={themeConfig.app.appLogoImage} alt='logo' />
            </span>
          </NavLink>
        </li>
      </ul>
    </div>
  )
}

export default VerticalMenuHeader
