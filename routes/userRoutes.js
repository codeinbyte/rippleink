var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')


router.post('/register-user', userController.registerUser);
router.post('/sign-in-user', userController.signInUser);
router.post('/sign-out-user', userController.signOutUser);

module.exports = router;
