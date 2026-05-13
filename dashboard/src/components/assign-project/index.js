// ** React Imports
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import axios from 'axios'

// ** Reactstrap Imports
import {
  Row,
  Col,
  Modal,
  Input,
  Label,
  Button,
  ModalBody,
  ModalHeader,
  FormFeedback
} from 'reactstrap'
import classnames from 'classnames'

import { getAllData as getAllUsers } from '../../views/custom/users/store'
import { getAllData as getAllProjects } from '../../views/custom/projects/store'

// ** Third Party Components
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import Flatpickr from 'react-flatpickr'

// ** Utils
import { getTestingModeEnabled, selectThemeColors } from '@utils'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/flatpickr/flatpickr.scss'

const countryOptions = [
  { value: 'uk', label: 'UK' },
  { value: 'usa', label: 'USA' },
  { value: 'france', label: 'France' },
  { value: 'russia', label: 'Russia' },
  { value: 'canada', label: 'Canada' }
]

const baseReturnPeriodOptions = [
  { value: 'annual', label: 'Annual' },
  { value: 'semi-annual', label: 'Semi-annual' },
  { value: 'quarterly', label: 'Quarterly' }
]

const AssignProject = ({ show, toggle, title, description, ProjectId, UserId }) => {

	const dispatch = useDispatch()
	
	const { allData: users } = useSelector(state => state.users)
	const { allData: projects } = useSelector(state => state.projects)
  const returnPeriodOptions = getTestingModeEnabled()
    ? [...baseReturnPeriodOptions, { value: 'testing', label: 'Testing (3 hours)' }]
    : baseReturnPeriodOptions
	
	const defaultValues = {
		ROI: null,
		returnPeriod: null,
		date: new Date()
	}
	if(ProjectId) defaultValues.ProjectId = ProjectId
	if(UserId) defaultValues.UserId = UserId

  // ** Hooks
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = async data => {
    if (Object.values(data).every(field => field != null)) {
			const toastId = toast.loading("Loading ...")
			try {
				const { ProjectId, UserId, ROI,  date, returnPeriod, user, project } = data
				const body = {
					roi: parseInt(ROI),
					date: date[0],
					returnPeriod: returnPeriod.value,
					ProjectId: ProjectId || project.value,
					UserId: UserId || user.value
				}
				await axios.post('/ledger/assign-project', body)
				toast.success("Project successfully assigned to the user!", { id: toastId })
				toggle()
			} catch (error) {
				console.log(error)
				toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
			}
    } else {
      for (const key in data) {
        if (!data[key]) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

	useEffect(() => {
		if(UserId) dispatch(getAllProjects())
		if(ProjectId) dispatch(getAllUsers())
	}, [])

	console.log(projects)
  return (
    <Modal isOpen={show} toggle={toggle} className='modal-dialog-centered modal-lg'>
    <ModalHeader className='bg-transparent' toggle={toggle}></ModalHeader>
    <ModalBody className='px-sm-5 mx-50 pb-5'>
        <div className='text-center mb-2'>
        <h1 className='mb-1'>{title}</h1>
        <p>{description}</p>
        </div>
        <Row tag='form' className='gy-1 pt-75' onSubmit={handleSubmit(onSubmit)}>
					{ProjectId && <Col md={6} xs={12}>
						<Label className='form-label' for='UserId'>User</Label>
						<Controller
              name='user'
              control={control}
              render={({ field }) => (
                <Select
                  isClearable={false}
                  classNamePrefix='select'
                  options={users?.map(user => ({ label: user.name, value: user.id }))}
                  theme={selectThemeColors}
                  className={classnames('react-select', { 'is-invalid': errors.user })}
                  {...field}
                />
              )}
            />
					</Col>}
					{UserId && <Col md={6} xs={12}>
							<Label className='form-label' for='ProjectId'>Project</Label>
							<Controller
								name='project'
								control={control}
								render={({ field }) => (
									<Select
										isClearable={false}
										classNamePrefix='select'
										options={projects?.filter(p => !p.ledgers.map(l => l.UserId).includes(UserId))
											.map(project => ({ label: project.name, value: project.id }))}
										theme={selectThemeColors}
										className={classnames('react-select', { 'is-invalid': errors.project })}
										{...field}
									/>
								)}
							/>
					</Col>}
					<Col md={6} xs={12}>
						<Label className='form-label' for='ROI'>ROI</Label>
						<Controller
							control={control}
							name='ROI'
							render={({ field }) => {
									return (
									<Input
										{...field}
										id='ROI'
										type="number"
										placeholder='Enter the ROI'
										value={field.value}
										max={100}
										min={0}
										required
										invalid={errors.ROI && true}
									/>
									)
							}}
						/>
						{errors.ROI && <FormFeedback>Please enter a valid ROI</FormFeedback>}
					</Col>

					<Col md={6} xs={12}>
						<Label className='form-label' for='language'>Return Period</Label>
						<Controller
							control={control}
							name='returnPeriod'
							render={({ field }) => {
									return (
										<Select
											isClearable={false}
											classNamePrefix='select'
											options={returnPeriodOptions}
											theme={selectThemeColors}
											className={classnames('react-select', { 'is-invalid': errors.returnPeriod })}
											defaultValue={returnPeriodOptions[0]}
											{...field}
										/>
									)
							}}
						/>
					</Col>

					<Col xs={12} className='text-center mt-2 pt-50'>
						<Button type='submit' className='me-1' color='primary'>Submit</Button>
						<Button type='reset' color='secondary' outline onClick={() => setShow(false)}>Discard</Button>
					</Col>
        </Row>
    </ModalBody>
    </Modal>
  )
}

export default AssignProject
