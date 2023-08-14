const mysql = require("mysql2");

// for local

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'relinksys_optical'
// }).promise()

// for paliwal ji

// const pool = mysql.createPool({
//     host: '198.38.93.60',
//     user: 'relinksys_optica',
//     password: 'RELinksys@_$123',
//     database: 'relinksys_optical'
// }).promise()


// for himanshu ji
// uri: `mysql://OTPG2:Rahul@9752885711@184.174.37.138/relinksys_optical`,
const pool = mysql.createPool({
    host: '184.174.37.138',
    user: 'OTPG2',
    password: 'Rahul@9752885711',
    database: 'relinksys_optical'
}).promise()


module.exports = { pool };