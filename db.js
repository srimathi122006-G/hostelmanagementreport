const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hostel_complaint_system'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.message);
    console.warn('NOTE: Make sure to import schema.sql into MySQL Workbench first!');
    return;
  }
  console.log('Connected to MySQL database successfully.');

  // Create default admin on startup if it doesn't exist
  db.query('SELECT * FROM admins WHERE username = ?', ['admin'], (err, results) => {
    if (results && results.length === 0) {
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (!err) {
          db.query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hash], (err) => {
            if (!err) console.log('Default admin account created (username: admin, password: admin123)');
          });
        }
      });
    }
  });
});

module.exports = db;
