// ** React Imports
import { Fragment, useState, useEffect } from 'react'

import toast from 'react-hot-toast'

// ** Axios Imports
import axios from 'axios'

// ** Reactstrap Imports
import { Row, Col, TabContent, TabPane } from 'reactstrap'

// ** Demo Components
import Tabs from './Tabs'
import AccountTabContent from './AccountTabContent'
import SecurityTabContent from './SecurityTabContent'
import MigrationTabContent from './MigrationTabContent'


// ** Styles
import '@styles/react/libs/flatpickr/flatpickr.scss'
import '@styles/react/pages/page-account-settings.scss'

const AccountSettings = () => {
  // ** States
  const [activeTab, setActiveTab] = useState('1')
  const [data, setData] = useState(null)

  const userId = data?.id

  const toggleTab = tab => {
    setActiveTab(tab)
  }

  useEffect(() => {
    axios.get('/auth/current-user').then(response => setData(response.data))
  }, [])

  const updateProfile = async ({ data, type, avatarFile }) => {
		const toastId = toast.loading("Loading ...")
    try {
      let response
      if (type === "profile") {
        const formData = new FormData()
        Object.keys(data || {}).forEach(key => {
          formData.append(key, data[key] ?? '')
        })
        if (avatarFile) {
          formData.append('avatar', avatarFile)
        }

        response = await axios.put('/user/' + userId, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      } else {
        response = await axios.put('/user/' + userId, data)
      }

      toast.success(`${type} successfully updated!`, { id: toastId })
      if(type === "profile"){
        const currentUser = JSON.parse(localStorage.getItem('userData'))
        const updatedUser = response?.data || {}
        localStorage.setItem("userData", JSON.stringify({ ...currentUser, ...updatedUser }))
        location.reload()
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
    }
  }

  return (
    <Fragment>
      {data !== null ? (
        <Row>
          <Col xs={12}>
            <Tabs
              className='mb-2'
              activeTab={activeTab}
              toggleTab={toggleTab}
              showMigrationTab={data?.role === 'admin'}
            />
            <TabContent activeTab={activeTab}>
              <TabPane tabId='1'>
                <AccountTabContent data={data} updateProfile={updateProfile} />
              </TabPane>
              <TabPane tabId='2'>
                <SecurityTabContent updateProfile={updateProfile} />
              </TabPane>
              {data?.role === 'admin' ? (
                <TabPane tabId='3'>
                  <MigrationTabContent />
                </TabPane>
              ) : null}
            </TabContent>
          </Col>
        </Row>
      ) : null}
    </Fragment>
  )
}

export default AccountSettings
