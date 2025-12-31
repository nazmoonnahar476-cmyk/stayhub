require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }

    console.log('Database schema initialized successfully');

    // Create default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@stayhub.com', hashedPassword, 'System Admin', 'admin']
      );
      console.log('Default admin user created (username: admin, password: admin123)');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('Admin user already exists');
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = initializeDatabase;

