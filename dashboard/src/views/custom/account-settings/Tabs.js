// ** Reactstrap Imports
import { Nav, NavItem, NavLink } from 'reactstrap'

// ** Icons Imports
import { User, Lock, Database } from 'react-feather'

const Tabs = ({ activeTab, toggleTab, showMigrationTab }) => {
  return (
    <Nav pills className='mb-2'>
      <NavItem>
        <NavLink active={activeTab === '1'} onClick={() => toggleTab('1')}>
          <User size={18} className='me-50' />
          <span className='fw-bold'>Account</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink active={activeTab === '2'} onClick={() => toggleTab('2')}>
          <Lock size={18} className='me-50' />
          <span className='fw-bold'>Security</span>
        </NavLink>
      </NavItem>
      {showMigrationTab && (
        <NavItem>
          <NavLink active={activeTab === '3'} onClick={() => toggleTab('3')}>
            <Database size={18} className='me-50' />
            <span className='fw-bold'>Migration</span>
          </NavLink>
        </NavItem>
      )}
    </Nav>
  )
}

export default Tabs
