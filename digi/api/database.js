const mysql = require("mysql2");

// for local ji

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'maindb',
//     waitForConnections: true,  // Prevent excessive connection creation
//     connectionLimit: 500,       // Limit active connections (adjust as needed)
//     queueLimit: 100              // No limit on queued requests
// }).promise()


// for maindb ji
const pool = mysql.createPool({
    host: '103.180.121.103',
    user: 'digieye_main',
    password: 'T103ks9c_',
    database: 'digieye_main',
    waitForConnections: true,  // Prevent excessive connection creation
    connectionLimit: 5000,       // Limit active connections (adjust as needed)
    queueLimit: 100              // No limit on queued requests
}).promise()



// for old software
const old_pool = mysql.createPool({
    host: '184.174.37.138',
    user: 'OTPG',
    password: 'Mehul@91303',
    database: 'OTPGPRODDEMO'
}).promise()


module.exports = { pool, old_pool };