// test-db.js - Test kết nối database
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'pub',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test query
    const [rows] = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log('Test result:', rows[0]);
    
    // Test tables exist
    const [tables] = await pool.query('SHOW TABLES');
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(' -', Object.values(table)[0]);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Check username/password in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️ Database "fruitshop" does not exist');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 MySQL server is not running');
    }
  }
}

testConnection();