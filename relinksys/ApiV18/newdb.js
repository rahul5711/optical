const mysql = require("mysql2/promise");
const config = require("./helpers/config");

// ❗ Do NOT pass URI because it contains unsupported params
// ❗ Use object format instead

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  dateStrings: true,
  multipleStatements: true,
  connectTimeout: config.db.connectTimeout, // valid
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
