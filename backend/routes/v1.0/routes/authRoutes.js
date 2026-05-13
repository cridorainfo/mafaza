const express         = require('express');
const router          = express.Router();
const authController  = require('../../../app/Controllers/AuthController');
const authValidation  = require('../../../app/Validation/AuthValidation');
const authorize       = require('../../../app/Middleware/Authorize');

router.post('/login', authValidation.authenticateSchema, authController.authenticate);
router.post('/register', authValidation.registerSchema, authController.register);
router.post('/forgot-password', authValidation.forgotPasswordSchema, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPasswordSchema, authController.resetPassword);
router.get('/current-user', authorize(["admin", "user"]), authController.currentUser);
router.post('/force-password-reset', authorize(["admin", "user"]), authValidation.forcePasswordResetSchema, authController.forcePasswordReset);

module.exports = router;
