// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import toast from 'react-hot-toast'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appUsers/getAllData', async () => {
  const response = await axios.get('/user', { page: 1, perPage: 200 })
  return response.data.data
})

export const getPending = createAsyncThunk('appUsers/getPending', async () => {
  const params = { page: 1, perPage: 20, status: "pending"}
  const response = await axios.get('/user', { params })
  return response.data.data
})

export const getData = createAsyncThunk('appUsers/getData', async params => {
  try {
    const response = await axios.get('/user', { params: { ...params, status: ["verified", "inactive"] } })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const getUser = createAsyncThunk('appUsers/getUser', async id => {
  const response = await axios.get('/api/users/user', { id })
  return response.data.user
})

export const addUser = createAsyncThunk('appUsers/addUser', async (params, { dispatch, getState }) => {
  await axios.post('/users/fake', params)
  await dispatch(getData(getState().users.params))
  await dispatch(getAllData())
  return user
})

export const updateUser = createAsyncThunk('appUsers/addUser', async (params, { dispatch, getState }) => {
  const { toastId, userId, ...body } = params
  try {
    await axios.put('/user/' + userId, body)
    toast.success("User successfully updated!", { id: toastId })
    await dispatch(getPending())
    await dispatch(getData(getState().users.params))
    await dispatch(getAllData())
  } catch (error) {
    console.log(error)
    toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
  }
})

export const appUsersSlice = createSlice({
  name: 'appUsers',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    pendingUsers: [],
    selectedUser: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getPending.fulfilled, (state, action) => {
        state.pendingUsers = action.payload
      })
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalItems
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.selectedUser = action.payload
      })
  }
})

export default appUsersSlice.reducer
