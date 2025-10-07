const mysql = require("mysql2");
const connectMainDb = require('../database');
const chalk = require('chalk');
const connected = chalk.bold.cyan;

async function db(DBkey) {
    let db;
    try {
        db = await connectMainDb.pool.getConnection();
        const [fetchDbConfig] = await db.query(`select * from dbconfiguration where DBkey = '${DBkey}'`);
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
            connectionLimit: 5000,       // Limit active connections (adjust as needed)
            queueLimit: 100              // No limit on queued requests
        }).promise();

        return pool;

    } catch (error) {
        console.log(error);
        return { success: false, message: "DB Config not found" }
    } finally {
        if (db) {
            try {
                db.release();
                console.log("✅ Company DB connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing company DB connection:", releaseErr);
            }
        }
    }

}
async function dbByCompanyID(CompanyID) {
    // console.log(connected("DB Connected By CompanyID ---->", CompanyID));
    let db;
    try {
        db = await connectMainDb.pool.getConnection();

        const [fetchDBKey] = await db.query(`select ID, DBKey from company where ID = ${CompanyID}`);

        if (!fetchDBKey.length) {
            return { success: false, message: "DBKey not found" }
        }
        const [fetchDbConfig] = await db.query(`select * from dbconfiguration where DBkey = '${fetchDBKey[0].DBKey}'`);
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
            connectionLimit: 5000,       // Limit active connections (adjust as needed)
            queueLimit: 100              // No limit on queued requests
        }).promise();

        return pool;

    } catch (error) {
        console.log(error);
        return { success: false, message: "DB Config not found" }
    } finally {
        if (db) {
            try {
                db.release();
                console.log("✅ Company DB connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing company DB connection:", releaseErr);
            }
        }
    }

}

module.exports = { db, dbByCompanyID }
