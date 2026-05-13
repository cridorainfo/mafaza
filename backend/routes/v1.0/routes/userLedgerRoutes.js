const express         = require('express');
const router          = express.Router();
const authorize       = require('../../../app/Middleware/Authorize');
const userLedgerController  = require('../../../app/Controllers/UserLedgerController');

router.get('/', authorize([], 'ledger'), userLedgerController.getAll);
router.post('/assign-project', authorize([], 'ledger'), userLedgerController.assignProject);
router.put('/:id', authorize([], 'ledger'), userLedgerController.update);

module.exports = router;
