import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getData = createAsyncThunk('auditTrail/getData', async params => {
  try {
    const response = await axios.get('/audit-log', { params })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const auditTrailSlice = createSlice({
  name: 'auditTrail',
  initialState: {
    data: [],
    total: 1,
    params: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getData.fulfilled, (state, action) => {
      state.data = action.payload.data
      state.params = action.payload.params
      state.total = action.payload.totalItems
    })
  }
})

export default auditTrailSlice.reducer
