var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./helpers/init');
require('dotenv').config();
const cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const chalk = require('chalk');
const connected = chalk.bold.cyan;

var app = express();
app.use(express.static(path.join(__dirname, '')));

const http = require('http').Server(app)

app.use(cors())

// app.use(function(req, res, next) {
//   console.log(req.headers.usergroup);
//   if (req.headers.usergroup !== 'SuperAdmin') {
//     return res.send({message: "expired", LoginCode: 3})
//   } else {
//     next();
//   }
// });
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/company', require('./routes/company.route'));
app.use('/login', require('./routes/login.route'));
app.use('/product', require('./routes/product.route'));
app.use('/file', require('./routes/file.route'));
app.use('/support', require('./routes/support.route'));
app.use('/shop', require('./routes/shop.route'));

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

// var whitelist = ['http://localhost:4200', 'http://localhost:3000']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }


const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
  console.log(connected(`server running on port ${PORT}`))
})

module.exports = app;
