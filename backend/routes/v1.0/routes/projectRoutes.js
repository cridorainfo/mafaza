const express         = require('express');
const router          = express.Router();
const Role            = require('../../../config/role');
const upload          = require('../../../config/multer');
const authorize       = require('../../../app/Middleware/Authorize');
const projectController  = require('../../../app/Controllers/ProjectController');

router.get('/', authorize([], 'projects'), projectController.getAll);
router.get('/carousel', projectController.getCarouselImages);
router.get('/:id', authorize([], 'projects'), projectController.getById);
router.put('/:projectId/ledgers/:ledgerId/roi', authorize(["admin"], 'projects'), projectController.updateLedgerRoi);
router.post('/', authorize(["admin"], 'projects'), upload.array("files", 10), projectController.create);
router.put('/:id', authorize(["admin"], 'projects'), upload.array("files", 10), projectController.update);

module.exports = router;
