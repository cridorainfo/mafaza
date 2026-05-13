// ** User List Component
import Table from './Table'
import AddProject from './AddProject'
import { Row, Col, TabContent, TabPane, Button, ButtonGroup, Badge } from 'reactstrap'
import Tabs from './Tabs'

import { getAllData } from './store'
import { useDispatch, useSelector } from 'react-redux'

// ** Styles
import '@styles/react/apps/app-users.scss'
import { useEffect, useState } from 'react'
import ProjectsList from './ProjectsList'
import { getTestingModeEnabled } from '@utils'

const UsersList = () => {

  const [activeTab, setActiveTab] = useState('1')
  const [adminView, setAdminView] = useState('card')
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false)
  const [adminProjectToEdit, setAdminProjectToEdit] = useState(null)

  const toggleTab = tab => {
    setActiveTab(tab)
  }

  const dispatch = useDispatch()
  const store = useSelector(state => state.projects)

  useEffect(() => {
    dispatch(getAllData())
    // dispatch(getMyProjects())
  }, [dispatch, store.allData?.length])

  const currentUser = JSON.parse(localStorage.getItem('userData'))
  const showTestingLabel = getTestingModeEnabled()

  const { allData } = store
  
  return (
    <div className='app-user-list'>
      {currentUser.role === "admin" ? (
        <>
          <div className='d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1'>
            <div className='d-flex align-items-center gap-1'>
              <h4 className='mb-0'>Projects</h4>
              {showTestingLabel ? <Badge color='warning' pill>Testing</Badge> : null}
            </div>
            <div className='d-flex align-items-center gap-1'>
              <ButtonGroup>
                <Button
                  color={adminView === 'card' ? 'primary' : 'outline-primary'}
                  onClick={() => setAdminView('card')}
                >
                  Card View
                </Button>
                <Button
                  color={adminView === 'table' ? 'primary' : 'outline-primary'}
                  onClick={() => setAdminView('table')}
                >
                  Table View
                </Button>
              </ButtonGroup>
              {adminView === 'card' ? (
                <Button
                  color='primary'
                  onClick={() => {
                    setAdminProjectToEdit(null)
                    setAdminSidebarOpen(true)
                  }}
                >
                  + Add Project
                </Button>
              ) : null}
            </div>
          </div>

          {adminView === 'card' ? (
            <>
              <ProjectsList
                projects={allData}
                showTestingLabel={showTestingLabel}
                isAdmin
                onEditProject={project => {
                  setAdminSidebarOpen(false)
                  setAdminProjectToEdit(project)
                }}
              />
              {(adminSidebarOpen || adminProjectToEdit) ? (
                <AddProject
                  projectToEdit={adminProjectToEdit}
                  open={adminSidebarOpen || adminProjectToEdit}
                  toggleSidebar={() => {
                    setAdminSidebarOpen(false)
                    setAdminProjectToEdit(null)
                  }}
                />
              ) : null}
            </>
          ) : (
            <Table showTestingLabel={showTestingLabel} />
          )}
        </>
      ) : <Row>
          <Col xs={12}>
            <Tabs className='mb-2' activeTab={activeTab} toggleTab={toggleTab} />
            <TabContent activeTab={activeTab}>
              <TabPane tabId='1'>
                <ProjectsList 
                showTestingLabel={showTestingLabel}
                projects={allData
                    .filter(p => (p?.ledgers || [])
                        .some(l => Number(l.UserId) === Number(currentUser.id))
                    )
                  }
                />
              </TabPane>
              <TabPane tabId='2'>
                <ProjectsList projects={allData} showTestingLabel={showTestingLabel} />
              </TabPane>
            </TabContent>
          </Col>
        </Row>}
    </div>
  )
}

export default UsersList
