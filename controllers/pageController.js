const { ObjectId } = require("mongodb");
const noteService = require('../services/noteService');

const loadIndex = async (req, res, next) => {
  try {
    if (req.session.userId) {
      return res.redirect('/auth-homepage');
    }

    res.render('index', {message: req.flash('message')});
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadRegister = async (req, res, next) => {
  try {
    if (req.session.userId) {
      return res.redirect('/auth-homepage');
    }
    res.render('register', {message: req.flash('message')});
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadAuthHomepage = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const userNotes = await noteService.getAllFromCollection({user_data_id: req.session.userId}, 'note');
    const userCollab = await noteService.getAllFromCollection({main_user_id: req.session.userId}, 'collaboration');
    const userFolders = await noteService.getAllFromCollection({user_data_id: req.session.userId}, 'folder');
    const sharedCollab = await noteService.getAllSharedCollab(req.session.userId);
    const recentNotes = await noteService.getRecentNotes(req.session.userId);

    res.render('authHomepage', {userNotes: userNotes, userCollab: userCollab, userFolders: userFolders, sharedCollab: sharedCollab, recentNotes: recentNotes});
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadNotePage = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const noteId = new ObjectId(req.params.noteId);
    const query = { _id: noteId };
    const result = await noteService.getOneFromCollection(query, 'note');
    const flashMessage = req.flash('message');

    const userNotes = await noteService.getAllFromCollection({user_data_id: req.session.userId}, 'note');
    const userCollab = await noteService.getAllFromCollection({main_user_id: req.session.userId}, 'collaboration');
    const sharedCollab = await noteService.getAllSharedCollab(req.session.userId);

    res.render('notePage', {
      userNotes: userNotes,
      userCollab: userCollab,
      sharedCollab: sharedCollab,
      message: flashMessage[0],
      note_id: noteId,
      folder_id: result.folder_id,
      title: result.title,
      text_content: result.text_content,
      drawing_content: result.drawing_content,
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadCollabPage = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    // if session is invalid BSON string, redirect to homepage
    if (!(/^[0-9a-fA-F]{24}$/.test(req.params.collabId))) {
      res.redirect('/'); 
    }

    let pageToRender = 'collabPage';

    // if user has no permission to view collab page, redirect to homepage
    const userDocOwnership = await noteService.getUserDocumentOwnership(req.session.userId, req.params.collabId);
    if (!userDocOwnership) {
      return res.redirect('/');
    } else if (userDocOwnership == 'can_view_user') {
      pageToRender = 'collabPageViewOnly';
    }

    const collabId = new ObjectId(req.params.collabId);
    const query = { _id: collabId };
    const result = await noteService.getOneFromCollection(query, 'collaboration');
    const flashMessage = req.flash('message');

    req.session.collabId = collabId;
    const userNotes = await noteService.getAllFromCollection({user_data_id: req.session.userId}, 'note');
    const userCollab = await noteService.getAllFromCollection({main_user_id: req.session.userId}, 'collaboration');
    const sharedCollab = await noteService.getAllSharedCollab(req.session.userId);

    res.render(pageToRender, {
      userNotes: userNotes,
      userCollab: userCollab,
      sharedCollab: sharedCollab,
      message: flashMessage[0],
      collab_id: result._id,
      folder_id: result.folder_id,
      title: result.title,
      text_content: result.text_content,
      drawing_content: result.drawing_content,
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadPublicNote = async (req, res, next) => {
  try {
    const publicUrl = req.params.publicUrl;
    const query = { public_url: publicUrl };
    const result = await noteService.getOneFromCollection(query, 'note');

    if (!result) {
      return res.redirect('/');
    } else {
      res.render('publicNote', {
        note_id: result._id,
        folder_id: result.folder_id,
        title: result.title,
        text_content: result.text_content,
        drawing_content: result.drawing_content,
      });
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

const loadFolderPage = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    // const folderId = new ObjectId(req.params.folderId);
    const userNotes = await noteService.getAllFromCollection({user_data_id: req.session.userId}, 'note');
    const userCollab = await noteService.getAllFromCollection({main_user_id: req.session.userId}, 'collaboration');
    const sharedCollab = await noteService.getAllSharedCollab(req.session.userId);
    const folderTitle = await noteService.getFolderTitle(req.params.folderId);
    const folderContent= await noteService.getFolderContent(req.session.userId, req.params.folderId);
    res.render('folderPage',
    {
      userNotes: userNotes,
      userCollab: userCollab,
      sharedCollab: sharedCollab,
      folderId: req.params.folderId,
      folderTitle: folderTitle,
      folderContent: folderContent
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

module.exports = {
  loadIndex,
  loadRegister,
  loadAuthHomepage,
  loadNotePage,
  loadCollabPage,
  loadPublicNote,
  loadFolderPage,
}
