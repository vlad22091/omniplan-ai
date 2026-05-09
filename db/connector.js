import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    user_prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Планування',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

pool.query(createTableQuery)
  .then(() => console.log(' Таблиця "plans" успішно перевірена/створена'))
  .catch((err) => console.error(' Помилка при створенні таблиці:', err));

export default pool;