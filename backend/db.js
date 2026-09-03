require("dotenv").config();

const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(
    `❌ Variabel environment wajib belum di-set: ${missingVars.join(", ")}`,
  );
  console.error("   Salin backend/.env.example ke backend/.env lalu isi nilainya.");
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,
  timezone: "+07:00",
});

pool
  .getConnection()
  .then((conn) => {
    console.log(
      `✅ MySQL connected to database: ${dbConfig.database} (${dbConfig.host})`,
    );
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;
