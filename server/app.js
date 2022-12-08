var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./helpers/init');
require('dotenv').config();
const cors = require('cors')
const getConnection = require('./helpers/db')
const JWT = require('jsonwebtoken')
var moment = require("moment-timezone");
var logger = require('morgan');
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const morgan = require('morgan') 
const { addRoutes } = require('./helpers/routes')
const loggerss = require("./helpers/logger");
var app = express();
app.use(express.static(path.join(__dirname, '')));

const http = require('http').Server(app)

app.use(cors())
morgan.token("custom", `:remote-addr - :remote-user [:date[iso]] ":method :url" :status :res[content-length] ms" :referrer" `)

//use the log format by api
app.use(morgan("custom", { stream: loggerss.getLogFileStream('access') }))
app.use(
  logger('combined', {
    skip: (req, res) => {
      return res.statusCode < 400 
    },
    stream: loggerss.getLogFileStream('error')
  })
)
//use the new format by name
app.use(function(req, res, next) {
  if (req.headers.authorization !== undefined) {
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }

      const connection = await getConnection.connection();
      const user = await connection.query(`select * from user where ID = ${payload.aud}`)
     
      if ( user && ( user[0].UserGroup !== 'CompanyAdmin' && user[0].UserGroup !== 'SuperAdmin')) {
        const companysetting = await connection.query(`select * from companysetting where Status = 1 and CompanyID = ${user[0].CompanyID}`)
        var currentTime = moment().tz("Asia/Kolkata").format("HH:mm");
        if (
          currentTime < companysetting[0].LoginTimeEnd
      ) {
        next()
      } else {
        return res.status(999).send({success: false, message: `your session has been expired`})
      }
      } else {
        next()
      }
    })
  } else {
    next();
  }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', require('./routes/index'));
// app.use('/company', require('./routes/company.route'));
// app.use('/login', require('./routes/login.route'));
// app.use('/product', require('./routes/product.route'));
// app.use('/file', require('./routes/file.route'));
// app.use('/support', require('./routes/support.route'));
// app.use('/shop', require('./routes/shop.route'));
// app.use('/role', require('./routes/role.route'));
// app.use('/employee', require('./routes/employee.route'));
// app.use('/supplier', require('./routes/supplier.route'));
// app.use('/doctor', require('./routes/doctor.route'));
// app.use('/fitter', require('./routes/fitter.route'));
// app.use('/expense', require('./routes/expense.route'));
// app.use('/payroll', require('./routes/payroll.route'));
// app.use('/pettycash', require('./routes/pettycash.route'));
addRoutes(app)
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
    loggerss.loggers.info(`server running on port : ${PORT}`)
  // connected(`server running on port ${PORT}`)
});


module.exports = app;
