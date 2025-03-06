const mysql = require("mysql2");

// for local ji

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'maindb'
}).promise()



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