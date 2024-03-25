const {connectDB} = require("../config/database");
const { ObjectId } = require('mongodb');
const noteService = require('../services/noteService');
const userService = require('../services/userService');


const createNewNote = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    query = {
      user_data_id: req.session.userId,
      title: 'Untitled',
      text_content: '',
      drawing_content: '',
      date_created: new Date()
    };

    const result = await noteService.insertOneToCollection(query, 'note');

    if (result && result.insertedId) {
      res.json( {url: '/note-page/'+result.insertedId} );
    }

  } catch (err) {
    console.error("Error:", err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const noteId = new ObjectId(req.body.note_id);
    const query = { _id: noteId };
    const updateData = {
      user_data_id: req.session.userId,
      title: req.body.title,
      text_content: req.body.text_content,
      drawing_content: req.body.drawing_content,
      last_edit: new Date()
    };

    const result = await noteService.updateOneToCollection(query, updateData, 'note');

    if (result.acknowledged) {
      // req.flash('message', 'Note updated!');
      return res.json(result);
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const deletion = await noteService.deleteOneFromCollection(req.session.userId, req.body._id, 'note');
    res.json(deletion);
  } catch (err) {
    console.error("Error:", err);
  }
}

const createNewCollab = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    query = {
      main_user_id: req.session.userId,
      can_edit_user_id: [],
      can_view_user_id: [],
      title: 'Untitled',
      text_content: '',
      drawing_content: '',
      date_created: new Date()
    };

    const result = await noteService.insertOneToCollection(query, 'collaboration');

    if (result && result.insertedId) {
      res.json( {url: '/collab-page/'+result.insertedId} );
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

const updateCollab = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const collabId = new ObjectId(req.body.collab_id);
    const query = { _id: collabId };
    const updateData = {
      title: req.body.title,
      text_content: req.body.text_content,
      drawing_content: req.body.drawing_content,
      last_edit: new Date()
    };

    const result = await noteService.updateOneToCollection(query, updateData, 'collaboration');

    if (result.acknowledged) {
      return res.json(result);
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

const deleteCollab = async (req, res, next) => {
  try {
    const deletion = await noteService.deleteOneFromCollection(req.session.userId, req.body._id, 'collaboration');
    res.json(deletion);
  } catch (err) {
    console.error("Error:", err);
  }
}

const searchAllNotes = async (req, res, next) => {
  try {
    const searchQuery = req.body.searchQuery;
    const result = await noteService.searchNotes(req.session.userId, searchQuery);
    res.json(result);
  } catch (err) {
    console.error("Error:", err);
  }
}

const sharePersonalNote = async (req, res, next) => {
  try {
    const noteId = req.body._id;
    const result = await noteService.togglePublicUrl(noteId, req);
    res.json(result);
  } catch (err) {
    console.error("Error:", err);
  }
}

const shareCollabNote = async (req, res, next) => {
  try {
    const email = req.body.email;
    const collabId = req.body._id;

    // check email to share collab note with exist in database
    const isEmailExist = await userService.isEmailExist(email);
    if (!isEmailExist) {
      return res.json({message: 'User not found.'});
    }

    const userData = await userService.getUserDataByEmail(email);
    const userDocOwnership = await noteService.getUserDocumentOwnership(userData._id, collabId);

    // if user has been added previously, return with a message
    if (userDocOwnership) {
      if (userDocOwnership == 'main_user') {
        return res.json({message: 'Unable to share with yourself.'});
      } else if (userDocOwnership == 'can_edit_user' || userDocOwnership == 'can_view_user') {
        return res.json({message: 'Note has been previously shared with this user.'});
      }
    }

    const sharedPermission = req.body.sharedPermission;
    const db = await connectDB();
    const collection = db.collection('collaboration');
    const query = new ObjectId(collabId);
    const data = (sharedPermission=='edit') ? { can_edit_user_id: userData._id } : { can_view_user_id: userData._id };
    const result = await collection.updateOne({ _id: query }, { $addToSet: data });
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}


const changeCollabSharingPermission = async (req, res, next) => {
  try {
    const collabId = new ObjectId(req.body._id);
    const sharedUserId = new ObjectId(req.body.sharedUserId);
    const newPermissionValue = req.body.sharedPermission;

    let dataToPull;
    let dataToPush;
    if (newPermissionValue == 'view') {
      dataToPull = {can_edit_user_id: sharedUserId};
      dataToPush = {can_view_user_id: sharedUserId};
    } else if (newPermissionValue == 'edit') {
      dataToPull = {can_view_user_id: sharedUserId};
      dataToPush = {can_edit_user_id: sharedUserId};
    } else {
      console.error('Invalid permission value');
    }

    const db = await connectDB();
    const collection = db.collection('collaboration');
    const result = await collection.updateOne(
      { _id: collabId },
      { 
         $pull: dataToPull,
         $push: dataToPush
      }
    )
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const removeCollabSharing = async (req, res, next) => {
  try {
    const collabId = new ObjectId(req.body._id);
    const sharedUserId = new ObjectId(req.body.sharedUserId);

    const db = await connectDB();
    const collection = db.collection('collaboration');
    const result = await collection.updateOne(
      { _id: collabId },
      {
        $pull: {
          can_edit_user_id: sharedUserId,
          can_view_user_id: sharedUserId
        }
      }
    )
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const getCollabNoteById = async (req, res, next) => {
  try {
    const collabId = new ObjectId(req.body._id);
    const query = { _id: collabId };
    let result = await noteService.getOneFromCollection(query, 'collaboration');

    let canEditEmailArray = [];
    let canViewEmailArray = [];

    if (result.can_edit_user_id) {
      for (const sharedUserId of result.can_edit_user_id) {
        const userId = new ObjectId(sharedUserId);
        const userData = await userService.getUserEmailById(userId);
        canEditEmailArray.push(userData.email);
      }
    }

    if (result.can_view_user_id) {
      for (const sharedUserId of result.can_view_user_id) {
        const userId = new ObjectId(sharedUserId);
        const userData = await userService.getUserEmailById(userId);
        canViewEmailArray.push(userData.email);
      }
    }
    result = { ...result, canEditEmail: canEditEmailArray, canViewEmail: canViewEmailArray };
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const createNewFolder = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const folderName = (req.body.folderName) ? req.body.folderName : 'Untitled';
    data = {user_data_id: req.session.userId, name: folderName, parent: 'root', notes: ''};
    const result = await noteService.createFolder(data);
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const getUserAllNotes = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    const result = await noteService.retrieveUserAllNotes(req.session.userId);
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const updateFolder = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const folderId = req.body.folderId;
    const noteToInsert = req.body.noteToInsert;
    const db = await connectDB();
    const collection = db.collection('folder');
    const query = new ObjectId(folderId);
    const data = { note_id: {$each: noteToInsert} };
    const result = await collection.updateOne({ _id: query }, { $addToSet: data });
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

const deleteFolder = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    const deletion = await noteService.deleteOneFromCollection(req.session.userId, req.body.folderId, 'folder');
    res.json(deletion);
  } catch (err) {
    console.error("Error:", err);
  }
}

const deleteNoteFromFolder = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    const objectFolderId = new ObjectId(req.body.folderId);
    const db = await connectDB();
    const collection = db.collection('folder');
    const result = await collection.updateOne(
      { _id: objectFolderId },
      { $pull: {note_id: req.body.noteId} }
    )
    res.json(result);

  } catch (err) {
    console.error("Error:", err);
  }
}

module.exports = {
  createNewNote,
  updateNote,
  deleteNote,
  createNewCollab,
  updateCollab,
  deleteCollab,
  searchAllNotes,
  sharePersonalNote,
  shareCollabNote,
  changeCollabSharingPermission,
  removeCollabSharing,
  getCollabNoteById,
  createNewFolder,
  getUserAllNotes,
  updateFolder,
  deleteFolder,
  deleteNoteFromFolder,
}
