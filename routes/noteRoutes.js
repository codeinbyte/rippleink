var express = require('express');
var router = express.Router();
const noteController = require('../controllers/noteController')

router.post('/create-new-note', noteController.createNewNote);
router.post('/update-note', noteController.updateNote);
router.post('/delete-note', noteController.deleteNote);

router.post('/create-new-collab', noteController.createNewCollab);
router.post('/update-collab', noteController.updateCollab);
router.post('/delete-collab', noteController.deleteCollab);

router.post('/search-all-notes', noteController.searchAllNotes);
router.post('/get-collab-note-by-id', noteController.getCollabNoteById);

router.post('/share-personal-note', noteController.sharePersonalNote);
router.post('/share-collab-note', noteController.shareCollabNote);
router.post('/change-collab-sharing-permission', noteController.changeCollabSharingPermission);
router.post('/remove-collab-sharing', noteController.removeCollabSharing);

router.post('/create-new-folder', noteController.createNewFolder);
router.post('/update-folder', noteController.updateFolder);
router.post('/delete-folder', noteController.deleteFolder);
router.post('/get-user-all-notes', noteController.getUserAllNotes);
router.post('/delete-note-from-folder', noteController.deleteNoteFromFolder);

module.exports = router;
