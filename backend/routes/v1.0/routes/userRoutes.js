const express         = require('express');
const router          = express.Router();
const userController  = require('../../../app/Controllers/UserController');
const userValidation  = require('../../../app/Validation/UserValidation');
const authorize       = require('../../../app/Middleware/Authorize');
const upload          = require('../../../config/multer');

router.get('/', authorize(["admin"], 'users'), userController.getAll);
router.get('/:id', authorize(["admin"], 'users'), userController.getById);
router.put('/:id', authorize(), upload.single('avatar'), userValidation.updateSchema, userController.update);
router.delete('/:id', authorize(), userController._delete);

module.exports = router;
