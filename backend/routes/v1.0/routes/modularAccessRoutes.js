const express = require('express');
const router = express.Router();
const authorize = require('../../../app/Middleware/Authorize');
const requirePrimaryAdmin = require('../../../app/Middleware/RequirePrimaryAdmin');
const modularAccessController = require('../../../app/Controllers/ModularAccessController');
const modularAccessValidation = require('../../../app/Validation/ModularAccessValidation');

router.get('/users', authorize(['admin'], 'users'), requirePrimaryAdmin, modularAccessController.getAll);
router.post('/users', authorize(['admin'], 'users'), requirePrimaryAdmin, modularAccessValidation.createSchema, modularAccessController.create);
router.put('/users/:id', authorize(['admin'], 'users'), requirePrimaryAdmin, modularAccessValidation.updateSchema, modularAccessController.update);

module.exports = router;
