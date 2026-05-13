const express         = require('express');
const router          = express.Router();
const Role            = require('../../../config/role');
const upload          = require('../../../config/multer');
const authorize       = require('../../../app/Middleware/Authorize');
const transactionController  = require('../../../app/Controllers/TransactionController');

router.get('/', authorize([], 'transactions'), transactionController.getAll);
router.post('/', authorize([], 'transactions'), upload.single("receipt"), transactionController.create);
router.put('/:id', authorize(["admin", "super_admin", "accountant"], 'transactions'), upload.single("receipt"), transactionController.update);

module.exports = router;
