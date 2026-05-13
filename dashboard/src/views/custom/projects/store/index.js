// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('projects/getAllData', async () => {
  const response = await axios.get('/project')
  return response.data.data
})

export const getMyProjects = createAsyncThunk('projects/getMyProjects', async () => {
  const response = await axios.get('/project/assigned')
  return response.data.data
})

export const getData = createAsyncThunk('projects/getData', async params => {
  try {
    const response = await axios.get('/project', { params })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const getUser = createAsyncThunk('projects/getUser', async id => {
  const response = await axios.get('/api/users/user', { id })
  return response.data.user
})

export const addProject = createAsyncThunk('projects/addProject', async ({ files, successCb, projectId, ...params }, { dispatch, getState }) => {
  const toastId = toast.loading("Loading ...")
  try {
    const formData = new FormData()
    Array.from(files || []).forEach(file => {
      formData.append('files', file)
    })
    Object.keys(params).forEach((key) => {
      formData.append(key, params[key])
    })

    if (projectId) {
      await axios.put('/project/' + projectId, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    } else {
      await axios.post('/project', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    }

    await dispatch(getData(getState().projects.params))
    await dispatch(getAllData())
    toast.success(`Project successfully ${projectId ? "updated" : "created"}!`, { id: toastId })
    successCb()
  } catch (error) {
    console.log(error)
    toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
  }
})

export const assignProject = createAsyncThunk('projects/assignProject', async (params, { dispatch, getState }) => {
  await axios.post('/users/fake', params)
})

export const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    myProjects: [],
    selectedUser: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getMyProjects.fulfilled, (state, action) => {
        state.myProjects = action.payload
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

export default projectsSlice.reducer
