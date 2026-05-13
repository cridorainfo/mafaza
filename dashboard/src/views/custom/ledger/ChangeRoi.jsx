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

// ** Third Party Components
import { useForm, Controller } from 'react-hook-form'


const ChangeRoi = ({ show, toggle, ledgerId, defaultRoi, triggerRefetch }) => {

	const defaultValues = {
		ROI: defaultRoi
	}

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
				await axios.put('/ledger/' + ledgerId, { roi: parseInt(data.ROI) })
				toast.success("ROI successfully updated!", { id: toastId })
				triggerRefetch()
				toggle()
			} catch (error) {
				toast.error(error?.response?.data?.message || "An unexpected error occurred. Please try again.", { id: toastId })
			}
		}
	}

	return (
		<Modal isOpen={show} toggle={toggle} className='modal-dialog-centered modal-md'>
			<ModalHeader className='bg-transparent' toggle={toggle}></ModalHeader>
			<ModalBody className='px-sm-5 mx-50 pb-5'>
				<div className='text-center mb-2'>
					<h1 className='mb-1'>Roi change</h1>
				</div>
				<Row tag='form' className='gy-1 pt-75' onSubmit={handleSubmit(onSubmit)}>
					<Col md={12} xs={12}>
						<Label className='form-label' for='ROI'>ROI (%)</Label>
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
					<Col xs={12} className='text-center mt-2 pt-50'>
						<Button type='submit' className='me-1' color='primary'>Submit</Button>
						<Button type='reset' color='secondary' outline onClick={toggle}>Discard</Button>
					</Col>
				</Row>
			</ModalBody>
		</Modal>
	)
}

export default ChangeRoi