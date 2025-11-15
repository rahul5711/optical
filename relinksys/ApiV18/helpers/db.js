const mysql = require("mysql2/promise");
const config = require("./config").db;

const pool = mysql.createPool({
  uri: config.uri,
  waitForConnections: true,
  connectionLimit: config.connectionLimit,
  dateStrings: true,
  multipleStatements: true,
  connectTimeout: config.connectTimeout,
});

/**
 * Get a connection from pool
 */
const connection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL pool connected: threadId " + conn.threadId);

    const query = async (sql, binding) => {
      try {
        const [rows] = await conn.query(sql, binding);
        return rows;
      } catch (err) {
        throw err;
      }
    };

    const release = async () => {
      console.log("MySQL pool released: threadId " + conn.threadId);
      conn.release();
    };

    return { query, release };
  } catch (err) {
    throw err;
  }
};

/**
 * Direct Pool Query
 */
const query = async (sql, binding) => {
  try {
    const [rows] = await pool.query(sql, binding);
    return rows;
  } catch (err) {
    throw err;
  }
};

module.exports = { pool, connection, query };
