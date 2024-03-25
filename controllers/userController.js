const {connectDB} = require('../config/database');
const userService = require('../services/userService')
const noteService = require('../services/noteService')
const bcrypt = require("bcryptjs");


const randomUsername = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = characters.charAt(Math.floor(Math.random() * (characters.length-10)));  // ensure first character is letter
  for (let i = 1; i < length; i++) {  // skip first character
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

const registerUser = async (req, res, next) => {
  try {
    const fullname = req.body.fullname.toLowerCase();
    const username = randomUsername(8);
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const verifyPassword = req.body.verifyPassword;

    if (password !== verifyPassword) {
      req.flash('message', 'Passwords do not match.');
      return res.redirect('/register');
    }

    // Check if email already exist
    const isEmailExist = await userService.isEmailExist(email);
    if (isEmailExist) {
      req.flash('message', 'Email already exist.');
      return res.redirect('/register');
    }

    // hash password before saving it in database
    const hashedPassword = await bcrypt.hash(password, 10)
    data = { fullname: fullname, username: username, email: email, password: hashedPassword };
    const db = await connectDB();
    const collection = db.collection('user_data');
    const result = await collection.insertOne(data);

    if (result.insertedId) {
      req.session.userId = result.insertedId;
      req.session.username = username;
      res.redirect('/auth-homepage');
    } else {
      res.render('index', {});
    }
  } catch (err) {
      console.error("Error:", err);
  }
};

const signInUser = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const userData = await userService.getUserDataByEmail(email);

    // No such email, return
    if (!userData){
      req.flash('message', 'Invalid email or password.');
      return res.redirect('/');
    }
    const result = await userService.passwordCheck(password, userData.password);

    if (result) {
      req.session.userId = userData._id;
      req.session.username = userData.username;
      res.redirect('/auth-homepage');
    } else {
      req.flash('message', 'Invalid email or password.');
      return res.redirect('/');
    }
  } catch (err) {
      console.error("Error:", err);
  }
};

const signOutUser = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect('/');
  } catch (err) {
    console.error("Error:", err);
  }
};

module.exports = {
  registerUser,
  signInUser,
  signOutUser,
}
