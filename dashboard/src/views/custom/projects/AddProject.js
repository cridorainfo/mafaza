// ** React Import
import { useState } from 'react'

// ** Custom Components
import Sidebar from '@components/sidebar'

// ** Third Party Components
import { useForm, Controller } from 'react-hook-form'

import { SafeImage } from '@components/safe-uploads'

// ** Reactstrap Imports
import { Button, Label, Form, Input } from 'reactstrap'

// ** Store & Actions
import { addProject } from './store'
import { useDispatch } from 'react-redux'


const checkIsValid = data => {
  return Object.values(data).every(field => (field !== null ))
}

const AddProjects = ({ open, toggleSidebar, projectToEdit }) => {
  // ** States
  const [data, setData] = useState(null)
  const [plan, setPlan] = useState('basic')
  const [role, setRole] = useState('subscriber')

  const [selectedFiles, setSelectedFiles] = useState([])

  const defaultValues = {
    name: projectToEdit?.name || '',
    totalInvestement: projectToEdit?.totalInvestement || '',
    minROI: projectToEdit?.minROI || '',
    maxROI: projectToEdit?.maxROI || '',
    description: projectToEdit?.description || ''
  }

  // ** Store Vars
  const dispatch = useDispatch()

  // ** Vars
  const {
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const successCb = () =>{
    toggleSidebar()
  }
  
  // ** Function to handle form submit
  const onSubmit = data => {
    setData(data)
    if (checkIsValid(data)) {
      dispatch(
        addProject({
          projectId: projectToEdit?.id || undefined,
          files: selectedFiles,
          ...data,
          successCb
        })
      )
    } else {
      for (const key in data) {
        if (data[key] !== null && data[key].length === 0) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

  const handleSidebarClosed = () => {
    for (const key in defaultValues) {
      setValue(key, '')
    }
    setSelectedFiles([])
    setRole('subscriber')
    setPlan('basic')
  }

  return (
    <Sidebar
      size='lg'
      open={open}
      title={projectToEdit ? `Edit Project - ${projectToEdit.name} ` : 'Create a project'}
      headerClassName='mb-1'
      contentClassName='pt-0'
      toggleSidebar={toggleSidebar}
      onClosed={handleSidebarClosed}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
      <div className='mb-1'>
          <Label className='form-label' for='name'>
            Project Name <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <Input id='name' type='text' placeholder='Project name' invalid={errors.name && true} required {...field} />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='totalInvestement'>
            Total Investment <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='totalInvestement'
            control={control}
            render={({ field }) => (
              <Input id='totalInvestement' type='number' min={1} placeholder='Ex: 100' invalid={errors.totalInvestement} required  {...field} />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='minROI'>
            Min ROI <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='minROI'
            control={control}
            render={({ field }) => (
              <Input id='minROI' type='number' min={1} placeholder='Ex: 100' required invalid={errors.minROI} {...field} />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='maxROI'>
            Max ROI <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='maxROI'
            control={control}
            render={({ field }) => (
              <Input id='maxROI' type='number' min={1} placeholder='Ex: 100' required invalid={errors.maxROI} {...field} />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='description'>
            Description <span className='text-danger'>*</span>
          </Label>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <Input id='description' type='textarea' placeholder='Project description' required invalid={errors.description} {...field} />
            )}
          />
        </div>

        <div className='mb-1'>
          <Label className='form-label' for='images'>
            Images {!projectToEdit ? <span className='text-danger'>*</span> : null}
          </Label>
          {projectToEdit?.ProjectImages?.[0]?.link ? (
            <div className='mb-50'>
              <SafeImage
                src={projectToEdit.ProjectImages[0].link}
                alt='Current project'
                className='w-100'
                style={{ maxHeight: '160px', objectFit: 'cover', borderRadius: '6px' }}
                fallback={
                  <div
                    className='w-100 d-flex align-items-center justify-content-center text-muted'
                    style={{ minHeight: '120px', background: '#f3f5f8', borderRadius: '6px' }}
                  >
                    Image unavailable
                  </div>
                }
              />
              <small className='text-muted d-block mt-25'>Upload new image(s) to replace current image(s).</small>
            </div>
          ) : null}
          <Input
            name='images'
            id='images'
            type='file'
            accept='image/*'
            multiple
            onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
            required={!projectToEdit}
          />
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

export default AddProjects
