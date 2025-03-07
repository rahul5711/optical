const mysql = require("mysql2");
const connectMainDb = require('../database');
async function db(DBkey) {
    try {
        const [fetchDbConfig] = await connectMainDb.pool.query(`select * from dbconfiguration where DBkey = '${DBkey}'`);
        if (!fetchDbConfig.length) {
            return { success: false, message: "DB Config not found" }
        }

        const { host, user, password, database } = fetchDbConfig[0];

        const pool = mysql.createPool({
            host: host,
            user: user,
            password: password,
            database: database,
            waitForConnections: true,  // Prevent excessive connection creation
            connectionLimit: 10,       // Limit active connections (adjust as needed)
            queueLimit: 0              // No limit on queued requests
        }).promise();

        return pool;

    } catch (error) {
        console.log(error);
        return { success: false, message: "DB Config not found" }
    }



}
async function dbByCompanyID(CompanyID) {
    try {
        const [fetchDBKey] = await connectMainDb.pool.query(`select ID, DBKey from company where ID = ${CompanyID}`);

        if (!fetchDBKey.length) {
            return { success: false, message: "DBKey not found" }
        }
        const [fetchDbConfig] = await connectMainDb.pool.query(`select * from dbconfiguration where DBkey = '${fetchDBKey[0].DBKey}'`);
        if (!fetchDbConfig.length) {
            return { success: false, message: "DB Config not found" }
        }

        const { host, user, password, database } = fetchDbConfig[0];

        const pool = mysql.createPool({
            host: host,
            user: user,
            password: password,
            database: database,
            waitForConnections: true,  // Prevent excessive connection creation
            connectionLimit: 10,       // Limit active connections (adjust as needed)
            queueLimit: 0              // No limit on queued requests
        }).promise();

        return pool;

    } catch (error) {
        console.log(error);
        return { success: false, message: "DB Config not found" }
    }



}

module.exports = { db, dbByCompanyID }
