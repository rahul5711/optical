const mysql = require("mysql2");

// for local ji

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'maindb',
    waitForConnections: true,  // Prevent excessive connection creation
    connectionLimit: 500,       // Limit active connections (adjust as needed)
    queueLimit: 100              // No limit on queued requests
}).promise()


// for maindb ji
// const pool = mysql.createPool({
//     host: '103.180.121.103',
//     user: 'relink_main',
//     password: '&rH00va89',
//     database: 'relinksys_optical_main',
//     waitForConnections: true,  // Prevent excessive connection creation
//     connectionLimit: 500,       // Limit active connections (adjust as needed)
//     queueLimit: 100              // No limit on queued requests
// }).promise()



// for paliwal ji

// const pool = mysql.createPool({
//     host: '198.38.93.60',
//     user: 'relinksys_optica',
//     password: 'RELinksys@_$123',
//     database: 'relinksys_optical'
// }).promise()


// const pool = mysql.createPool({
//     host: '103.180.121.103',
//     user: 'relinksys_optica',
//     password: '4Fn!616wm',
//     database: 'relinksys_optical'
// }).promise()



// for himanshu ji

// const pool = mysql.createPool({
//     host: '184.174.37.138',
//     user: 'OTPG2',
//     password: 'Rahul@9752885711',
//     database: 'relinksys_optical'
// }).promise()

// for old software
const old_pool = mysql.createPool({
    host: '184.174.37.138',
    user: 'OTPG',
    password: 'Mehul@91303',
    database: 'OTPGPRODDEMO'
}).promise()


module.exports = { pool, old_pool };