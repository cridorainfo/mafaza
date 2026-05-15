// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Third Party Components
import Select from 'react-select'
import Cleave from 'cleave.js/react'
import { useForm, Controller } from 'react-hook-form'
import 'cleave.js/dist/addons/cleave-phone.us'
import defaultAvatar from '@src/assets/images/default.webp'

// ** Reactstrap Imports
import { Row, Col, Form, Card, Input, Label, Button, CardBody, CardTitle, CardHeader, FormFeedback } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

const countryOptions = [
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' }
]

const AccountTabs = ({ data, updateProfile }) => {

  const [avatar, setAvatar] = useState(data.avatar ? data.avatar : defaultAvatar)
  const [avatarFile, setAvatarFile] = useState(null)

  // ** Hooks
  const defaultValues = {
    name: data.name,
    email: data.email,
    phoneNumber: data.phoneNumber,
    country: data.country || "",
    address: data.address
  }
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  // ** States

  useEffect(() => {
    setAvatar(data?.avatar || defaultAvatar)
  }, [data?.avatar])

  const onSubmit = data => {
    updateProfile({
      data,
      avatarFile,
      type: "profile"
    })
  }

  const onChange = e => {
    const files = e.target.files
    if (!files || !files[0]) return

    setAvatarFile(files[0])
    const reader = new FileReader(),
      selectedFiles = files
    reader.onload = function () {
      setAvatar(reader.result)
    }
    reader.readAsDataURL(selectedFiles[0])
  }

  const handleImgReset = () => {
    setAvatarFile(null)
    setAvatar(defaultAvatar)
  }

  return (
    <Fragment>
      <Card>
        <CardHeader className='border-bottom'>
          <CardTitle tag='h4'>Profile Details</CardTitle>
        </CardHeader>
        <CardBody className='pb-2'>
          <div className='d-flex mt-2'>
            <div className='me-25'>
              <img
                className='rounded me-50'
                src={avatar}
                alt='Profile'
                height='100'
                width='100'
                onError={() => setAvatar(defaultAvatar)}
              />
            </div>
            <div className='d-flex align-items-end mt-75 ms-1'>
              <div>
                <Button tag={Label} className='mb-75 me-75' size='sm' color='primary'>
                  Upload
                  <Input type='file' onChange={onChange} hidden accept='image/*' />
                </Button>
                <Button className='mb-75' color='secondary' size='sm' outline onClick={handleImgReset}>
                  Reset
                </Button>
                <p className='mb-0'>Allowed JPG, GIF or PNG. Max size of 800kB</p>
              </div>
            </div>
          </div>

          <Form className='mt-2 pt-50' onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col sm='6' className='mb-1'>
                <Label className='form-label' for='name'>
                  Name
                </Label>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input id='name' placeholder='John' invalid={errors.name && true} {...field} />
                  )}
                />
                {errors && errors.name && <FormFeedback>Please enter a valid Name</FormFeedback>}
              </Col>
              <Col sm='6' className='mb-1'>
                <Label className='form-label' for='email'>
                  E-mail
                </Label>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input id='email'  type='email' placeholder='Email' required invalid={errors.email && true} {...field} />
                  )}
                />
                {errors && errors.email && <FormFeedback>Please enter a valid Name</FormFeedback>}
              </Col>
              <Col sm='6' className='mb-1'>
                <Label className='form-label' for='phoneNumber'>
                  Phone Number
                </Label>
                <Controller
                  name='phoneNumber'
                  control={control}
                  render={({ field }) => (
                    <Cleave
                      id='phoneNumber'
                      name='phoneNumber'
                      className='form-control'
                      placeholder='1 234 567 8900'
                      options={{ phone: true, phoneRegionCode: 'AE' }}
                      required invalid={errors.phoneNumber && true} {...field}
                    />
                  )}
                />
                {errors && errors.phoneNumber && <FormFeedback>Please enter a valid phone number</FormFeedback>}
              </Col>
              <Col sm='6' className='mb-1'>
                <Label className='form-label' for='country'>
                  Country
                </Label>
                <Select
                  id='country'
                  isClearable={false}
                  className='react-select'
                  classNamePrefix='select'
                  options={countryOptions}
                  theme={selectThemeColors}
                  defaultValue={countryOptions[0]}
                />
              </Col>
              <Col sm='6' className='mb-1'>
                <Label className='form-label' for='address'>
                  Address
                </Label>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <Input id='address' placeholder='12, Business Park' invalid={errors.address && true} required {...field} />
                  )}
                />
                {errors && errors.address && <FormFeedback>Please enter a valid address</FormFeedback>}
              </Col>
              <Col className='mt-2' sm='12'>
                <Button type='submit' className='me-1' color='primary'>
                  Save changes
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default AccountTabs
