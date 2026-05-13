import React, { Suspense, useEffect } from 'react'

// ** Router Import
import Router from './router/Router'

// ** Axios Imports
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { handleLogout } from './redux/authentication'

const App = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    async function checkUser() {
      const accessToken = localStorage.getItem('accessToken')
      if(accessToken){
        try {
          const { data } = await axios.get('/auth/current-user')
        } catch (error) {
          console.log("inside catch", error)
          return dispatch(handleLogout())
        }
      }
    }
    checkUser()
  }, [])

  return (
    <Suspense fallback={null}>
      <Router />
    </Suspense>
  )
}

export default App
