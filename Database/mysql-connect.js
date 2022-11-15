const util = require("util");
const mysql = require("mysql");

/**
 * Pool parameters
 */
const pool = mysql.createPool({
        connectionLimit: 100,
        host: "remotemysql.com",
        user: "sfmfEIeANp",
        password: "22W9xQBylX",
        database: "sfmfEIeANp",
});

/**
 * Connect to DB
 */
pool.getConnection((err, connection) => {
        if (err) console.error(`Something went wrong with the database connection. ${err}`);
        if (connection) connection.release();
        return;
});

pool.query = util.promisify(pool.query);

module.exports = pool;
