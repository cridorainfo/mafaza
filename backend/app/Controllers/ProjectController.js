const Role = require('../../config/role');
const projectService     = require('../Services/project.service');

class ProjectController {

    async getAll(req, res, next) {
        const query = req.user.role === Role.Admin ? req.query : {...req.query, UserId: req.user.id }
        projectService.getAll(query)
            .then(projects => res.json(projects))
            .catch(next);
    }

    async getCarouselImages(req, res, next) {
        projectService.getCarouselImages()
            .then(projects => res.json(projects))
            .catch(next);
    }

    async getById(req, res, next) {
        projectService.getById(req.params.id)
            .then(project => project ? res.json(project) : res.sendStatus(404))
            .catch(next);
    }

    async create(req, res, next) {
        projectService.create(req, req.get('origin'))
            .then(() => res.json(
                { 
                    message: 'Project successfully created!' 
                }
            )).catch(next);
    }

    async update(req, res, next) {
        // Only Admin can edit
        if (req.user.role !== Role.Admin) 
            return res.status(401).json({ message: 'Unauthorized' });
        
        projectService.update(req.params.id, req.body, req.user, req.ip, req.files)
            .then(project => res.json(project))
            .catch(next);
    }

    async updateLedgerRoi(req, res, next) {
        if (req.user.role !== Role.Admin)
            return res.status(401).json({ message: 'Unauthorized' });

        projectService.updateLedgerRoi(req.params.projectId, req.params.ledgerId, req.body, req.user, req.ip)
            .then(ledger => res.json(ledger))
            .catch(next);
    }

}
module.exports = new ProjectController();
