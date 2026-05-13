// ** React Imports
import { Fragment } from 'react'
import * as Icon from 'react-feather'

// ** Custom Components
import NavbarUser from './NavbarUser'
import { Sun, Moon, ChevronLeft, ChevronRight } from 'react-feather'

import { NavItem, NavLink } from 'reactstrap'

const ThemeNavbar = props => {
  // ** Props
  const { skin, setSkin, setMenuVisibility, menuCollapsed, setMenuCollapsed, windowWidth } = props

  // ** Function to toggle Theme (Light/Dark)
  const ThemeToggler = () => {
    if (skin === 'dark') {
      return <Sun className='ficon' onClick={() => setSkin('light')} />
    } else {
      return <Moon className='ficon' onClick={() => setSkin('dark')} />
    }
  }

  return (
    <Fragment>
      <div className='bookmark-wrapper d-flex align-items-center'>
        <ul className='navbar-nav d-xl-none'>
          <NavItem className='mobile-menu me-auto'>
            <NavLink className='nav-menu-main menu-toggle hidden-xs is-active' onClick={() => setMenuVisibility(true)}>
              <Icon.Menu className='ficon' />
            </NavLink>
          </NavItem>
        </ul>
        {typeof setMenuCollapsed === 'function' && windowWidth >= 1200 ? (
          <NavItem className='d-none d-xl-block me-1'>
            <NavLink
              className='nav-link-style cursor-pointer'
              onClick={e => {
                e.preventDefault()
                setMenuCollapsed(!menuCollapsed)
              }}
            >
              {menuCollapsed ? <ChevronRight className='ficon' /> : <ChevronLeft className='ficon' />}
            </NavLink>
          </NavItem>
        ) : null}
        <NavItem className='d-block'>
          <NavLink className='nav-link-style'>
            <ThemeToggler />
          </NavLink>
        </NavItem>
      </div>
      <NavbarUser skin={skin} setSkin={setSkin} />
    </Fragment>
  )
}

export default ThemeNavbar
