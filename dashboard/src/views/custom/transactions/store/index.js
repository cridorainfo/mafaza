// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('transactions/getAllData', async () => {
  const response = await axios.get('/transaction')
  return response.data.data
})

export const getData = createAsyncThunk('transactions/getData', async params => {
  try {
    const response = await axios.get('/transaction', { params })
    return {
      params,
      data: response.data.data,
      totalItems: response.data.totalRecords
    }
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return {
      params,
      data: [],
      totalItems: 0
    }
  }
})

export const addTransaction = createAsyncThunk('transactions/addTransaction', async ({ file, successCb, ...params }, { dispatch, getState }) => {
  const toastId = toast.loading("Loading ...")
  try {
    const formData = new FormData();
    formData.append("receipt", file);

    Object.keys(params).forEach((key) => {
      formData.append(key, params[key]);
    });
    await axios.post('/transaction', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    await dispatch(getData(getState().transactions.params))
    await dispatch(getAllData())
    toast.success("Transaction successfully uploaded!", { id: toastId })
    successCb()
  } catch (error) {
    console.log(error)
    toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
  }
})

export const uploadAdminReceipt = createAsyncThunk('transactions/uploadAdminReceipt', async ({ file, successCb, transactionId }, { dispatch, getState }) => {
  const toastId = toast.loading("Loading ...")
  try {
    const formData = new FormData();
    formData.append("receipt", file);

    await axios.put('/transaction/' + transactionId, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    await dispatch(getData(getState().transactions.params))
    await dispatch(getAllData())
    toast.success("Receipt successfully uploaded!", { id: toastId })
    successCb()
  } catch (error) {
    console.log(error)
    toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
  }
})

export const updateTransaction = createAsyncThunk('appUsers/updateTransaction', async (params, { dispatch, getState }) => {
  const { toastId, userId, ...body } = params
  try {
    await axios.put('/transaction/' + userId, body)
    toast.success("Transaction successfully updated!", { id: toastId })
    await dispatch(getData(getState().users.params))
    await dispatch(getAllData())
  } catch (error) {
    console.log(error)
    toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
  }
})


export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: []
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

export default transactionsSlice.reducer
