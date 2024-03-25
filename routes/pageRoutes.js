var express = require('express');
var router = express.Router();
const pageController = require('../controllers/pageController')

router.get('/', pageController.loadIndex);
router.get('/register', pageController.loadRegister);
router.get('/auth-homepage', pageController.loadAuthHomepage);
router.get('/note-page/:noteId', pageController.loadNotePage);
router.get('/collab-page/:collabId', pageController.loadCollabPage);
router.get('/public-note/:publicUrl', pageController.loadPublicNote);
router.get('/folder-page/:folderId', pageController.loadFolderPage);

module.exports = router;
