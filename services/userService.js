const {connectDB} = require('../config/database');
const { ObjectId } = require('mongodb');
const bcrypt = require("bcryptjs");


const passwordCheck = async (password, passwordInDB) => {
  try {
    return await bcrypt.compare(password, passwordInDB);
  } catch (err) {
    console.error('Error checking password:', err);
  }
};

const isEmailExist = async (email) => {
  try {
    const db = await connectDB();
    const collection = db.collection('user_data');
    const query = {email: email};
    return await collection.findOne(query);
  } catch (err) {
    console.error('Error checking email:', err);
  }
};

const getUserDataByEmail = async (email) => {
  try {
    const query = { email: email };
    const db = await connectDB();
    const collection = db.collection('user_data');
    return await collection.findOne(query);
  } catch (err) {
    console.error("Error:", err);
  }
};

const getUserEmailById = async (userId) => {
  try {
    const query = { _id: userId };
    const db = await connectDB();
    const collection = db.collection('user_data');
    return await collection.findOne(query, { projection: {email: 1, _id: 0} });
  } catch (err) {
    console.error("Error:", err);
  }
};

module.exports = {
  passwordCheck,
  isEmailExist,
  getUserDataByEmail,
  getUserEmailById,
}
