var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./helpers/init');
require('dotenv').config();
const cors = require('cors')
// const getConnection = require('./newdb')
const mysql2 = require('./database')
const dbConfig = require('./helpers/db_config');
const JWT = require('jsonwebtoken')
var moment = require("moment-timezone");
var logger = require('morgan');
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const morgan = require('morgan')
const { addRoutes } = require('./helpers/routes')
const { cronConnect } = require('./helpers/init_cron')
const loggerss = require("./helpers/logger");
const { log } = require('console');
var app = express();
global.appRoot = path.resolve(__dirname);
app.use('/assest', express.static('assest'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('view engine', 'pug');
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

// app.use(async function (req, res, next) {
//   try {
//     if (req.headers.authorization !== undefined) {
//       const authHeader = req.headers['authorization'];
//       const bearerToken = authHeader.split(' ');
//       const token = bearerToken[1];

//       JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
//         if (err) {
//           const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
//           return next(createError.Unauthorized(message));
//         }

//         try {
//           const [user] = await mysql2.pool.query(`SELECT * FROM user WHERE ID = ${payload.aud}`);

//           if (user && user.length && user[0] && user[0]?.UserGroup !== 'CompanyAdmin' && user[0]?.UserGroup !== 'SuperAdmin') {
//             const db = await dbConnection(user[0]?.CompanyID);
//             if (db?.success === false) {
//               return res.status(200).json({ success: false, message: db.message || 'Database connection failed' }); // ✅ Safe
//             }


//             const [companysetting] = await db.query(`SELECT * FROM companysetting WHERE Status = 1 AND CompanyID = ${user[0].CompanyID}`);

//             const currentTime = moment().tz("Asia/Kolkata").format("HH:mm");

//             if (currentTime >= companysetting[0]?.LoginTimeEnd) {
//               //return res.status(200).send({ success: false, message: `Your session has expired.` });
//               return res.status(200).send({ success: false, message: `⏰ Shop closed: You attempted to log in outside of business hours. Please try again during working hours.` });
//             }

//             if (companysetting[0]?.IsIpCheck === "true") {
//               const [fetchIps] = await db.query(`SELECT Remark, ip FROM ipaddress WHERE Status = 1 AND CompanyID = ${user[0].CompanyID}`);

//               if (fetchIps.length > 0) {
//                 const ip = req.headers.ip || '**********';
//                 console.log("Header IP :- ", ip);

//                 const checkIp = await checkIPExist(fetchIps, ip);
//                 // const checkIp = true
//                 console.log("checkIp :- ", checkIp);

//                 if (!checkIp) {
//                   return res.status(200).send({ success: false, message: `🔐 Access denied: Your current IP address is not authorized. Please contact your administrator to grant access.` });
//                 }
//               } else {
//                 return res.status(200).send({ success: false, message: `🔐 Access denied: Your current IP address is not authorized. Please contact your administrator to grant access.` });
//               }
//             }
//             return next(); // ✅ safe fallback for all valid paths
//           } else {
//             return next(); // SuperAdmin or CompanyAdmin
//           }
//         } catch (innerError) {
//           console.error("Middleware internal error:", innerError);
//           return next(createError.InternalServerError("Internal error during auth middleware."));
//         }
//       });
//     } else {
//       return next(); // No authorization header
//     }
//   } catch (outerError) {
//     console.error("Middleware outer error:", outerError);
//     return next(createError.InternalServerError("Unexpected middleware error."));
//   }
// });

// app.use(async function (req, res, next) {
//   let db; // For company-specific DB
//   let connection; // Optional, for manual mysql2 pool connection if needed
//   try {
//     if (req.headers.authorization) {
//       const authHeader = req.headers['authorization'];
//       const token = authHeader.split(' ')[1];
//       JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
//         try {
//           if (err) {
//             const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
//             return next(createError.Unauthorized(message));
//           }

//           // If you want manual connection for better release control
//           connection = await mysql2.pool.getConnection();
//           const [user] = await connection.query(`SELECT * FROM user WHERE ID = ${payload.aud}`);

//           if (user && user.length && user[0]?.UserGroup !== 'CompanyAdmin' && user[0]?.UserGroup !== 'SuperAdmin') {
//             db = await dbConnection(user[0]?.CompanyID);
//             if (db?.success === false) {
//               return res.status(200).json({ success: false, message: db.message || 'Database connection failed' });
//             }

//             const [companysetting] = await db.query(
//               `SELECT * FROM companysetting WHERE Status = 1 AND CompanyID = ${user[0].CompanyID}`
//             );

//             const currentTime = moment().tz("Asia/Kolkata").format("HH:mm");

//             if (currentTime >= companysetting[0]?.LoginTimeEnd) {
//               return res.status(200).send({
//                 success: false,
//                 message: `⏰ Shop closed: You attempted to log in outside of business hours. Please try again during working hours.`,
//               });
//             }

//             if (companysetting[0]?.IsIpCheck === "true") {
//               const [fetchIps] = await db.query(
//                 `SELECT Remark, ip FROM ipaddress WHERE Status = 1 AND CompanyID = ${user[0].CompanyID}`
//               );

//               const ip = req.headers.ip || '**********';
//               const checkIp = await checkIPExist(fetchIps, ip);
//               if (fetchIps.length === 0 || !checkIp) {
//                 return res.status(200).send({
//                   success: false,
//                   message: `🔐 Access denied: Your current IP address is not authorized. Please contact your administrator to grant access.`,
//                 });
//               }
//             }
//             return next(); // ✅ Valid user & company
//           } else {
//             return next(); // ✅ SuperAdmin / CompanyAdmin
//           }
//         } catch (innerError) {
//           console.error("Middleware internal error:", innerError);
//           return next(createError.InternalServerError("Internal error during auth middleware."));
//         } finally {
//           if (db) {
//             try {
//               db.release();
//               console.log("✅ Company DB connection released");
//             } catch (releaseErr) {
//               console.error("⚠️ Error releasing company DB connection:", releaseErr);
//             }
//           }
//           if (connection) {
//             try {
//               connection.release();
//               console.log("✅ MySQL pool connection released");
//             } catch (releaseErr) {
//               console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
//             }
//           }
//         }
//       });
//     } else {
//       return next(); // No auth header
//     }
//   } catch (outerError) {
//     console.error("Middleware outer error:", outerError);
//     return next(createError.InternalServerError("Unexpected middleware error."));
//   } finally {
//     if (db) {
//       try {
//         db.release();
//         console.log("✅ Company DB connection released");
//       } catch (releaseErr) {
//         console.error("⚠️ Error releasing company DB connection:", releaseErr);
//       }
//     }
//     if (connection) {
//       try {
//         connection.release();
//         console.log("✅ MySQL pool connection released");
//       } catch (releaseErr) {
//         console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
//       }
//     }
//   }
// });

// view engine setup


app.use(async function (req, res, next) {
  let db;
  let connection;

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];

    // ✅ Convert JWT.verify to Promise
    const payload = await new Promise((resolve, reject) => {
      JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    connection = await mysql2.pool.getConnection();
    const [user] = await connection.query(`SELECT * FROM user WHERE ID = ${payload?.aud}`);

    if (!user?.length) {
      throw createError.Unauthorized('User not found');
    }

    const currentUser = user[0];

    // Skip DB/IP checks for admin users
    if (['CompanyAdmin', 'SuperAdmin'].includes(currentUser.UserGroup)) {
      return next();
    }

    db = await dbConnection(currentUser.CompanyID);
    if (db?.success === false) {
      return res.status(200).json({ success: false, message: db.message || 'Database connection failed' });
    }

    const [companysetting] = await db.query(
      `SELECT * FROM companysetting WHERE Status = 1 AND CompanyID = ?`,
      [currentUser.CompanyID]
    );

    const currentTime = moment().tz('Asia/Kolkata').format('HH:mm');

    if (currentTime >= companysetting[0]?.LoginTimeEnd) {
      return res.status(200).send({
        success: false,
        message: `⏰ Shop closed: You attempted to log in outside of business hours.Please try again during working hours.`,
      });
    }

    if (companysetting[0]?.IsIpCheck === 'true') {
      const [fetchIps] = await db.query(
        `SELECT Remark, ip FROM ipaddress WHERE Status = 1 AND CompanyID = ?`,
        [currentUser.CompanyID]
      );

      const ip = req.headers.ip || req.ip || '****';
      const checkIp = await checkIPExist(fetchIps, ip);
      if (fetchIps.length === 0 || !checkIp) {
        return res.status(200).send({
          success: false,
          message: `🔐 Access denied: Your current IP address is not authorized.Please contact your administrator to grant access.`,
        });
      }
    }

    next(); // ✅ Valid user & company
  } catch (err) {
    console.error('Middleware error:', err);
    const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
    next(createError.Unauthorized(message));
  } finally {
    // ✅ Safe release
    if (db?.release) {
      try {
        db.release();
        console.log('✅ Company DB connection released');
      } catch (releaseErr) {
        console.error('⚠️ Error releasing company DB connection:', releaseErr);
      }
    }
    if (connection) {
      try {
        connection.release();
        console.log('✅ MySQL pool connection released');
      } catch (releaseErr) {
        console.error('⚠️ Error releasing MySQL pool connection:', releaseErr);
      }
    }
  }
});

app.use(logger('dev'));
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public', 'web')))
app.use('/web', express.static(path.join(__dirname, 'public', 'web')))
app.use('/web/*', express.static(path.join(__dirname, 'public', 'web')))
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
// cronConnect()
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
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

let count = 0;
async function heartBeat() {
  count += 1;
  const now = new Date();
  console.log(`[${now.toLocaleString()}] ======== ❤ Heart Beat ❤  ======== Count: ${count}`);
}

setInterval(heartBeat, 10000);


const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
  console.log('Current Node.js version:', process.version);
  loggerss.loggers.info(`server running on port : ${PORT}`)
  connected(`server running on port ${PORT}`)
});


module.exports = app;


let dbCache = {}; // Cache for storing database instances

async function dbConnection(CompanyID) {
  // Check if the database instance is already cached
  if (dbCache[CompanyID]) {
    return dbCache[CompanyID];
  }

  // Fetch database connection
  const db = await dbConfig.dbByCompanyID(CompanyID);

  if (db.success === false) {
    return db;
  }
  // Store in cache
  dbCache[CompanyID] = db;
  return db;
}

async function checkIPExist(ips, ipToCheck) {
  return ips.some(item => item.ip === ipToCheck);
}