const mysql = require("mysql2/promise");
const config = require('./helpers/config');

// ❗ Do NOT pass URI because it contains unsupported params
// ❗ Use object format instead

const pool = mysql.createPool({
  host: config.old_db.host,
  user: config.old_db.user,
  password: config.old_db.password,
  database: config.old_db.database,
  waitForConnections: true,
  connectionLimit: config.old_db.connectionLimit,
  dateStrings: true,
  multipleStatements: true,
  connectTimeout: config.old_db.connectTimeout, // valid
});

const connection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL pool connected: threadId " + conn.threadId);

    const query = async (sql, binding) => {
      const [rows] = await conn.query(sql, binding);
      return rows;
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

const query = async (sql, binding) => {
  const [rows] = await pool.query(sql, binding);
  return rows;
};

module.exports = { pool, connection, query };