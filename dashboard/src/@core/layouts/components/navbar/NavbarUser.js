// ** Dropdowns Imports
import NotificationDropdown from './NotificationDropdown'
import UserDropdown from './UserDropdown'

const NavbarUser = () => {
  
  return (
    <ul className='nav navbar-nav align-items-center ms-auto'>
      <NotificationDropdown />
      <UserDropdown />
    </ul>
  )
}
export default NavbarUser
