// require("dotenv").config();

const mysql = require("mysql2");

class MysqlService {
  getConnection() {
    return mysql
      .createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { ca: process.env.DB_CERT },
      })
      .promise();
  }
}

module.exports = MysqlService;
