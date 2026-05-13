const express = require('express');
const router = express.Router();
const authorize = require('../../../app/Middleware/Authorize');
const migrationController = require('../../../app/Controllers/MigrationController');
const migrationValidation = require('../../../app/Validation/MigrationValidation');

router.get('/template', authorize(['admin'], 'users'), migrationController.template);
router.get('/export', authorize(['admin'], 'users'), migrationController.exportData);
router.post('/import', authorize(['admin'], 'users'), migrationValidation.importSchema, migrationController.importData);

module.exports = router;
