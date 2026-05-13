// ** React Import
import { useState, useEffect } from 'react'

// ** Custom Components
import Sidebar from '@components/sidebar'
import Select from 'react-select'
import classnames from 'classnames'
import Flatpickr from 'react-flatpickr'
import '@styles/react/libs/flatpickr/flatpickr.scss'

// ** Third Party Components
import { useForm, Controller } from 'react-hook-form'
import { selectThemeColors } from '@utils'

// ** Reactstrap Imports
import { Button, Label, Form, Input } from 'reactstrap'

// ** Store & Actions
import { useDispatch } from 'react-redux'
import { uploadAdminReceipt } from './store'


const checkIsValid = data => {
  return Object.values(data).every(field => field !== null)
}

const UploadAdminReceipt = ({ open, toggleSidebar, transactionId }) => {
  // ** States
  const [selectedFile, setSelectedFile] = useState(null);

  // ** Store Vars
  const dispatch = useDispatch()

  // ** Vars
  const {
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ })

  const successCb = () =>{
    toggleSidebar()
  }
  
  // ** Function to handle form submit
  const onSubmit = data => {
    if (checkIsValid(data)) {
      dispatch(
        uploadAdminReceipt({
          transactionId,
          file: selectedFile,
          successCb
        })
      )
    } else {
      for (const key in data) {
        if (data[key] !== null) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

  return (
    <Sidebar
      size='lg'
      open={open}
      title='Upload Admin Receipt'
      headerClassName='mb-1'
      contentClassName='pt-0'
      toggleSidebar={toggleSidebar}
      onClosed={() => {}}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className='mb-1'>
          <Label className='form-label' for='receipt'>
            Attach the file here<span className='text-danger'>*</span>
          </Label>
          <Input name='receipt' id='receipt' type='file' accept="image/*,application/pdf" 
            onChange={e => setSelectedFile(e.target.files[0])} required />
        </div>
        <Button type='submit' className='me-1' color='primary'>
          Submit
        </Button>
        <Button type='reset' color='secondary' outline onClick={toggleSidebar}>
          Cancel
        </Button>
      </Form>
    </Sidebar>
  )
}

export default UploadAdminReceipt