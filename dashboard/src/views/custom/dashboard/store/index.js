// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('dashboard/getAllData', async () => {
  try {
    const { data: stats } = await axios.get('/stats')
    return { stats }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      stats: {
        verifiedUsers: 0,
        pendingUsers: 0,
        totalProjects: 0,
        totalReturns: 0,
        totalInvestments: 0,
        totalWithdrawals: 0,
        avgRoi: 0
      }
    }
  }
})

export const getData = createAsyncThunk('dashboard/getData', async params => {
  try {
    const response = await axios.get('/transaction', { params })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch dashboard transactions:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const getNextPayments = createAsyncThunk('dashboard/getNextPayments', async () => {
  try {
    const { data } = await axios.get('/stats/next-payments')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch next payments:', error)
    return []
  }
})

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: [],
    stats: {},
    nextPayments: [],
    total: 1,
    params: {},
    allData: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.stats = action.payload.stats
      })
      .addCase(getNextPayments.fulfilled, (state, action) => {
        state.nextPayments = action.payload
      })
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalItems
      })
  }
})

export default dashboardSlice.reducer
