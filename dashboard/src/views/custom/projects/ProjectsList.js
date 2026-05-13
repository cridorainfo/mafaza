import { useState } from 'react'
import { Link } from 'react-router-dom'
// ** Reactstrap Imports
import { Card, CardTitle, CardBody, CardText, CardImg, Row, Col, Badge, Button } from 'reactstrap'
import AssignProject from '../../../components/assign-project'
import './projects.scss'
const ProjectsList = ({ projects, showTestingLabel = false, isAdmin = false, onEditProject }) => {
  const [assignProject, setAssignProject] = useState(null)

  return (
    <>
      <Row className='match-height'>
        {projects.length == 0 ? <Card className='py-4 text-center'>
  				<CardTitle tag='h4' className="mb-0">No Projects found</CardTitle>
  			</Card> : projects.map(pr => {
          const imageSrc = pr?.ProjectImages?.[0]?.link
          return (
            <Col key={pr.id} lg='4' md='6'>
              <Card>
                {imageSrc ? (
                  <CardImg className="project-image" top src={imageSrc} alt='Project cover' />
                ) : (
                  <div className='project-image project-image-placeholder d-flex align-items-center justify-content-center'>
                    No Image
                  </div>
                )}
                <CardBody>
                  <div className='d-flex align-items-center justify-content-between mb-1'>
                    <CardTitle tag='h4' className='mb-0'>{pr?.name || 'Untitled Project'}</CardTitle>
                    {showTestingLabel ? <Badge color='warning' pill>Testing</Badge> : null}
                  </div>
                  <CardText>
                    {pr?.description || 'No description available.'}
                  </CardText>
                  {isAdmin ? (
                    <div className='d-flex gap-50 flex-wrap'>
                      <Button color='primary' outline size='sm' onClick={() => setAssignProject(pr)}>
                        Assign
                      </Button>
                      <Button color='secondary' outline size='sm' onClick={() => onEditProject && onEditProject(pr)}>
                        Edit
                      </Button>
                      <Button color='info' outline size='sm' tag={Link} to={`/projects/${pr.id}/users`}>
                        View Users
                      </Button>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </Col>
          )
        })}
      </Row>
      {assignProject ? (
        <AssignProject
          ProjectId={assignProject.id}
          title={assignProject.name || 'Project'}
          description='Assign this project to a user'
          show={Boolean(assignProject)}
          toggle={() => setAssignProject(null)}
        />
      ) : null}
    </>
  )
}

export default ProjectsList
