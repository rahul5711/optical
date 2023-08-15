require('dotenv').config();
module.exports = {
    db: {
        // uri: `mysql://root:@localhost/relinksys_optical`,
        // uri: `mysql://relinksys_optica:RELinksys@_$123@198.38.93.60/relinksys_optical`,
        uri: `mysql://OTPG2:Rahul@9752885711@184.174.37.138/relinksys_optical`,
        connectionLimit: 100,
        acquireTimeout: 100000,
        connectTimeout: 100000  
    },
    secret: 'asc-256-OTPG', 
    algorithm: "HS512"
} 