// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('ledger/getAllData', async () => {
  const response = await axios.get('/ledger')
  return response.data.data
})

export const getData = createAsyncThunk('ledger/getData', async params => {
  try {
    const response = await axios.get('/ledger', { params })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch ledger data:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const ledgerSlice = createSlice({
  name: 'ledger',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedUser: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalItems
      })
  }
})

export default ledgerSlice.reducer
