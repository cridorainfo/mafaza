import { useEffect, useState } from 'react'
import { BarChart, User, UserCheck, Sliders, Phone, Mail, CreditCard, Calendar, Airplay, Smartphone, Headphones } from 'react-feather'
import { useDispatch } from 'react-redux'
import { handleLogout } from '../../../redux/authentication'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import moment from 'moment'
import LoadingSpinner from "../../../@core/components/spinner/Loading-spinner"

const getActivationName = (slug) => {
  switch(slug){
    case "VR":
      return "VR"
    case "AS":
      return "App Simulation"
    case "DD":
      return "Digital Discovery"
    default:
      return slug
  }
}

const ProfilePage = () => {

	const [userData, setUserData] = useState("loading")
  const dispatch = useDispatch()

	let { userId } = useParams();
	
	useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/user/' + userId)
        setUserData(res.data)
      } catch (error) {
        console.log(error)
        if(error?.response?.status == 401){
          dispatch(handleLogout())
          return window.location.reload()
        }else{
          // return window.location.href = "/dashboard"
				}
      }
    }
    fetchData()
  }
  , [])

  if (typeof userData === "string") 
    return <LoadingSpinner className="mt-4" />

  const VR = userData.activations?.filter(activation => activation.slug === "VR").length
  const AS = userData.activations?.filter(activation => activation.slug === "AS").length
  const DD = userData.activations?.filter(activation => activation.slug === "DD").length

  return (
    <div className='profile-page'>
        <div className="row">
            <div className="col-xl-5 col-lg-5 col-md-5">
                <div className="card mb-6">
                    <div className="card-body">
                        <small className="card-text text-uppercase text-muted small">About</small>
                        <ul className="list-unstyled my-2">
                            <li className="d-flex align-items-center mb-2">
                                <CreditCard size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">RFID:</span> 
                                <span>{userData.rfid}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <User size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Full Name:</span> 
                                <span>{userData.name}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <Sliders size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Registration type:</span> 
                                <span>{userData.type === "guest" ? "Guest" : "Full"}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <Calendar size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Registration Date:</span> 
                                <span>{moment(userData.createdAt).format("L")}</span>
                            </li>
                            {userData.phone && <li className="d-flex align-items-center mb-2">
                                <Phone size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Phone number:</span> 
                                <span>{userData.phone}</span>
                            </li>}
                            {userData.email && <li className="d-flex align-items-center">
                                <Mail size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Email:</span> 
                                <span>{userData.email}</span>
                            </li>}
                        </ul>
                        <small className="card-text text-uppercase text-muted small">Activations</small>
                        <ul className="list-unstyled my-2">
                            <li className="d-flex align-items-center mb-2">
                                <UserCheck size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Total:</span> 
                                <span>{userData?.activations.length}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <Headphones size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">VR:</span> 
                                <span>{VR}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <Airplay size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">Digital Discovery:</span> 
                                <span>{DD}</span>
                            </li>
                            <li className="d-flex align-items-center mb-2">
                                <Smartphone size={18} className="icon-m-r" /> 
                                <span className="fw-medium me-1">App Simulation:</span> 
                                <span>{AS}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
            </div>
            <div className="col-xl-7 col-lg-7 col-md-7">
            <div className="card card-action mb-6">
      <div className="card-header align-items-center">
        <h5 className="card-action-title mb-0">
            <BarChart size={18}/> {" "}
            Activity Timeline</h5>
      </div>
      <div className="card-body pt-2">
        <ul className="timeline mb-0">
          <li className="timeline-item timeline-item-transparent">
            <span className="timeline-point timeline-point-success"></span>
            <div className="timeline-event">
              <div className="timeline-header mb-2">
                <h6 className="mb-0">The user dispensed a card from the kiosk</h6>
                <small className="text-muted">{moment(userData.createdAt).format("LLL")}</small>
              </div>
            </div>
          </li>
          {userData.activations.map(activation => <li className="timeline-item timeline-item-transparent">
            <span className="timeline-point timeline-point-info"></span>
            <div className="timeline-event">
              <div className="timeline-header mb-2">
                <h6 className="mb-0">The user invoked the {getActivationName(activation.slug)} activation</h6>
                <small className="text-muted">{moment(activation.createdAt).format("LLL")}</small>
              </div>
            </div>
          </li>)}
     
        </ul>
      </div>
    </div>
            </div>
        </div>
    </div>
  )
}

export default ProfilePage
