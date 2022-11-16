require('dotenv').config();
module.exports = {
    db: {
        uri: `mysql://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}/${process.env.DATABASE}`,
        // uri: 'mysql://relinksys_devone:RS@optical#2022@198.38.93.60/relinksys_devone',

        connectionLimit: 100,
        acquireTimeout: 100000,
        connectTimeout: 100000  
    },
    secret: 'asc-256-OTPG', 
    algorithm: "HS512"
} 