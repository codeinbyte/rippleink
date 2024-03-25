const {connectDB} = require('../config/database');
const { ObjectId } = require('mongodb');

const checkDocumentBelongsToUser = async (userId, documentId, collectionName) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    const queryId = new ObjectId(documentId);

    let result;
    if (collectionName == 'note') {
      result = await collection.findOne({
        $and: [
            { _id: queryId },
            { user_data_id: userId }
        ]
      });
    } else if (collectionName == 'collaboration') {
      result = await collection.findOne({
        $and: [
            { _id: queryId },
            { main_user_id: userId }
        ]
      });
    } else if (collectionName == 'folder') {
      result = await collection.findOne({
        $and: [
            { _id: queryId },
            { user_data_id: userId }
        ]
      });
    }
    return result;
  } catch (err) {
    throw Error('Error getting result.');
  }  
}

// check whether user is owner of document or shared user with edit/view permission
const getUserDocumentOwnership = async (userId, documentId) => {
  try {
    const query = new ObjectId(documentId);
    const db = await connectDB();
    const collection = db.collection('collaboration');
    const result = await collection.findOne({_id: query});

    // if no result, return empty string
    if (!result) {
      return '';
    }

    if (result.can_view_user_id) {
      const arrayAsString = result.can_view_user_id.join(',');
      if (arrayAsString.includes(userId)) {
        return 'can_view_user';
      }
    }

    if (result.can_edit_user_id) {
      const arrayAsString = result.can_edit_user_id.join(',');
      if (arrayAsString.includes(userId)) {
        return 'can_edit_user';
      }
    }

    if (result.main_user_id == userId) {
      return 'main_user';
    }

    // all if-statements fail, return empty string
    return '';
  } catch (err) {
    throw Error('Error getting user type.');
  }
}

const createFolder = async (data) => {
  try {
    const db = await connectDB();
    const collection = db.collection('folder');
    return await collection.insertOne(data);
  } catch (err) {
    throw Error('Error creating folder.');
  }
};

const insertOneToCollection = async (query, collectionName) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    return await collection.insertOne(query);
  } catch (err) {
    throw Error('Error getting data.');    
  }  
}

const updateOneToCollection = async (query, updateData, collectionName) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    return await collection.updateOne(query, { $set: updateData });
  } catch (err) {
    throw Error('Error getting data.');    
  }
}

const getOneFromCollection = async (query, collectionName) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    return await collection.findOne(query);
  } catch (err) {
    throw Error('Error getting data.');    
  }
}

const getAllFromCollection = async (query, collectionName) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    return await collection.find(query).toArray();
  } catch (err) {
    throw Error('Error getting data.');    
  }
}

const getAllSharedCollab = async (userId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('collaboration');
    const query = new ObjectId(userId);

    const result = await collection.find({
      $or: [
        { can_edit_user_id: { $eq: query } },
        { can_view_user_id: { $eq: query } }
      ]
    }).toArray();
    return result;

  } catch (err) {
    console.error("Error:", err);
  }
}

const deleteOneFromCollection = async (userId, documentId, collectionName) => {
  try {
    const checkResult = await checkDocumentBelongsToUser(userId, documentId, collectionName);

    // return if document doesn't belong to user
    if (!checkResult){
      return {Error: 'Document not exist'};
    }

    const db = await connectDB();
    const collection = db.collection(collectionName);
    const query = new ObjectId(documentId)
    return await collection.deleteOne({ _id: query });
  } catch (err) {
    throw Error('Error deleting data.');
  }
}

const togglePublicUrl = async (noteId, req) => {
  try {
    const query = new ObjectId(noteId);
    const getNote = await getOneFromCollection({ _id: query }, 'note');
    let data = {};
    let url=''; // if public url exist, change it to empty string

    // if public url not exist, create it
    if (!getNote.public_url) {
      // generate 10 random characters to be used as public url
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        url += characters.charAt(randomIndex);
      }
    }

    data = { public_url: url };
    const db = await connectDB();
    const collection = db.collection('note');
    result = await collection.updateOne({ _id: query }, { $set: data });

    return {public_url: url};

  } catch (err) {
    throw Error('Error updating data.');
  }
}

const searchNotes = async (userId, searchQuery) => {
  try {
    const objectUserId = new ObjectId(userId);
    const db = await connectDB();
    const regex = new RegExp(".*" + searchQuery + ".*", "i");

    let collabResult = await db.collection('collaboration').find(
    {
      'title' : regex,
      $or: [{ main_user_id: userId },
        { can_edit_user_id: { $eq: objectUserId } },
        { can_view_user_id: { $eq: objectUserId } }]
    },
    {
      projection: { title: 1 }
    })
    .sort({ title: 1 })
    .toArray();

    let noteResult = await db.collection('note').find(
      { user_data_id: userId, 'title' : regex},
      { projection: { title: 1, user_data_id: 1 }
    })
    .sort({ title: 1 })
    .toArray();

    let jointResult = [...collabResult, ...noteResult];

    // Sort all the notes in descending order by title
    if (jointResult.length > 0) {
      jointResult.sort((a, b) => new Date(b.title) - new Date(a.title));
    }

    // Assign document ownership to every notes to distinguish them
    for (const result of jointResult) {
      if (result.user_data_id) {
        result.document_ownership = 'personal_note';
      } else {
        result.document_ownership = await getUserDocumentOwnership(objectUserId, result._id);
      }
    }

    return jointResult;

  } catch (err) {
    throw Error('Error getting data.');
  }
}

const getRecentNotes = async (userId) => {
  try {
    const objectUserId = new ObjectId(userId);
    const db = await connectDB();
    let noteResult = await db.collection('note').find({ user_data_id: userId }, { projection: { title: 1, text_content: 1, last_edit: 1, user_data_id: 1 } })
    .sort({ last_edit: -1 })
    .limit(6)
    .toArray();
    let collabResult = await db.collection('collaboration').find(
    {
      $or: [{ main_user_id: userId },
        { can_edit_user_id: { $eq: objectUserId } },
        { can_view_user_id: { $eq: objectUserId } }]
    },
    {
      projection: { title: 1, text_content: 1, last_edit: 1 }
    })
    .sort({ last_edit: -1 })
    .limit(6)
    .toArray();

    let jointResult = [...noteResult, ...collabResult];

    // Sort all the notes in descending order by last_edit date
    if (jointResult.length > 0) {
      jointResult.sort((a, b) => new Date(b.last_edit) - new Date(a.last_edit));
      jointResult = jointResult.slice(0, 8);
    }

    // Assign document ownership to every notes to distinguish them
    for (const result of jointResult) {
      if (result.user_data_id) {
        result.document_ownership = 'personal_note';
      } else {
        result.document_ownership = await getUserDocumentOwnership(objectUserId, result._id);
      }
    }
    return jointResult;

  } catch (err) {
    throw Error('Error getting data.');
  }
}

const retrieveUserAllNotes = async (userId) => {
  try {
    const db = await connectDB();
    let noteResult = await db.collection('note').find({ user_data_id: userId }, { projection: { title: 1, text_content: 1, user_data_id: 1 } })
    .toArray();
    let collabResult = await db.collection('collaboration').find(
    { main_user_id: userId }, { projection: { title: 1, text_content: 1, main_user_id: 1 } })
    .toArray();

    let jointResult = [...collabResult, ...noteResult];
    return jointResult;

  } catch (err) {
    throw Error('Error getting data.');
  }
}

const getFolderTitle = async (folderId) => {
  try {
    const objectFolderId = new ObjectId(folderId);
    const db = await connectDB();
    const collection = db.collection('folder');
    const result = await collection.findOne({ _id: objectFolderId });
    return result.name;

  } catch (err) {
    console.error("Error:", err);
  }
}

const getFolderContent = async (userId, folderId) => {
  try {
    const objectFolderId = new ObjectId(folderId);
    const db = await connectDB();
    const collection = db.collection('folder');
    const document = await collection.findOne({
      $and: [
          { _id: objectFolderId },
          { user_data_id: userId }
      ]
    });

    let result=[];
    if (document && document.note_id) {
      for (const noteId of document.note_id) {
        const db = await connectDB();
        const findNote = await db.collection('note').findOne({ _id: new ObjectId(noteId) });

        // If _id is in note collection, go to next loop
        if (findNote) {
          findNote.document_ownership = 'personal_note';
          result.push(findNote);
          continue;
        }

        const findCollab = await db.collection('collaboration').findOne({ _id: new ObjectId(noteId) });
        if (findCollab) {
          findCollab.document_ownership = 'main_user';
          result.push(findCollab);
        }
      }
    }
    return result;

  } catch (err) {
    console.error("Error:", err);
  }
}

module.exports = {
  getUserDocumentOwnership,
  createFolder,
  insertOneToCollection,
  updateOneToCollection,
  getOneFromCollection,
  getAllFromCollection,
  getAllSharedCollab,
  deleteOneFromCollection,
  togglePublicUrl,
  searchNotes,
  getRecentNotes,
  retrieveUserAllNotes,
  getFolderTitle,
  getFolderContent,
}
