require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

const caCert = fs.readFileSync(path.join(__dirname, "certs/ca-cert.pem"));

// Crear la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { ca: caCert },
}).promise();

module.exports = pool;
