const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const pageRoutes = require('./routes/pageRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();
app.use(flash());

const { createServer } = require('node:http');
const server = createServer(app);
const io = require("socket.io")(server);

//Froala editor CSS & JS files
app.use('/froalacss',express.static(__dirname+'/node_modules/froala-editor/css/froala_editor.pkgd.min.css'));
app.use('/froalajs',express.static(__dirname+'/node_modules/froala-editor/js/froala_editor.pkgd.min.js'));
app.use('/froalacss_table',express.static(__dirname+'/node_modules/froala-editor/css/plugins/table.min.css'));
app.use('/froalacss_colors',express.static(__dirname+'/node_modules/froala-editor/css/plugins/colors.min.css'));
app.use('/froalajs_table',express.static(__dirname+'/node_modules/froala-editor/js/plugins/table.min.js'));
app.use('/froalajs_colors',express.static(__dirname+'/node_modules/froala-editor/js/plugins/colors.min.js'));

const sessionMiddleware = session({
  secret: 'Iamtheonewhoknocksonport3000',
  resave: false,
  saveUninitialized: true,
});

app.use(sessionMiddleware);

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// connect to database
const {connectDB} = require('./config/database');
connectDB();

// start socket.io server
const { startSocketServer } = require('./config/socket');
startSocketServer(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);
app.use('/user', userRoutes);
app.use('/note', noteRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
