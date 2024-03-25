const { ObjectId } = require('mongodb');
const {connectDB} = require("../config/database");


function startSocketServer(io) {
  io.on("connection", async(socket) => {
    const db = await connectDB();
    const collection = db.collection('collaboration');
    let roomId;
    // console.log('a user connected');
  
    socket.on("joinRoom", (roomIdValue) => {
      roomId = roomIdValue;
      socket.join(roomId);
    });

    // handle chat message connection
    socket.on('chat_message', async (msg, clientOffset, collabId, callback) => {
      try {
        if (socket.request.session.userId) {
          // Store message in DB
          const username = socket.request.session.username;
          const msgWithName = username + ": "+msg;
          const chatMessage = {msg: msgWithName, client_offset: clientOffset};
          const query = new ObjectId(collabId);
          const data = {chat_message: chatMessage};
          await collection.updateOne({ _id: query }, { $push: data });

          // Emit message to clients
          io.to(roomId).emit('chat_message', msgWithName, collabId.toString());
        } else {
          io.to(roomId).emit('chat_message', 'User not signed in');
        }
      } catch (err) {
        console.error('Error opening socket for chat message:', err);
      }
    });

    // handle note collaboration connection
    socket.on('note', async (msg, clientOffset, collabId, callback) => {
      try {
        // Store message in DB
        const query = new ObjectId(collabId);
        const data = {text_content: msg};
        await collection.updateOne({ _id: query }, { $set: data });

        // Emit message to clients
        socket.broadcast.to(roomId).emit('note', msg, collabId.toString());
      } catch (err) {
        console.error('Error opening socket for note collab:', err);
      }
    });

    // handle title change
    socket.on('title_change', async (title, collabId) => {
      try {
        // Store title in DB
        const query = new ObjectId(collabId);
        const data = {title: title};
        await collection.updateOne({ _id: query }, { $set: data });

        // Emit title to clients
        socket.broadcast.to(roomId).emit('title_change', title, collabId.toString());
      } catch (err) {
        console.error('Error handling title change:', err);
      }
    });

    // handle drawing connection
    socket.on('drawing', async (svgPath, clientOffset, collabId, callback) => {
      try {
        // Store message in DB
        const query = new ObjectId(collabId);
        const data = {drawing_content: JSON.stringify(svgPath)};
        await collection.updateOne({ _id: query }, { $set: data });

        // Emit message to clients
        socket.broadcast.to(roomId).emit('drawing', svgPath, collabId.toString());
      } catch (err) {
        console.error('Error opening socket for drawing:', err);
      }
    });

    if (!socket.recovered) {
      try {
        const collabId = socket.handshake.query.collabId;

        // Retrieve messages from DB
        const query = {_id: new ObjectId(collabId)};
        const chatHistory = await collection.find(query).toArray();

        if (typeof chatHistory[0] !== 'undefined' && typeof chatHistory[0].chat_message !== 'undefined') {
          await chatHistory[0].chat_message.forEach((txt) => {
            socket.emit('chat_message', txt.msg, collabId.toString());
          });
        }
      } catch (err) {
        console.error('Error retrieving messages from MongoDB:', err);
      }
    }

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

module.exports.startSocketServer = startSocketServer;
