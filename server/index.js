import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// Проверяем JWT секрет
if (!JWT_SECRET) {
  console.error('ОШИБКА: Не установлена переменная окружения JWT_SECRET');
  console.error('Добавьте JWT_SECRET в файл server/.env');
  process.exit(1);
}

// Админ данные из переменных окружения
const ADMIN_LOGIN = process.env.ADMIN_LOGIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Проверяем, что переменные окружения установлены
if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
  console.error('ОШИБКА: Не установлены переменные окружения ADMIN_LOGIN и ADMIN_PASSWORD');
  console.error('Создайте файл server/.env с этими переменными');
  process.exit(1);
}

// Подключение к базе данных
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ОШИБКА: Не установлена переменная окружения DATABASE_URL');
  console.error('Добавьте DATABASE_URL в файл server/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Авторизация админа
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;

  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { login: ADMIN_LOGIN, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token,
      user: { login: ADMIN_LOGIN, role: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Неверный логин или пароль' });
  }
});

// Проверка токена
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Получить все локации (доступно всем)
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM literature_locations ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

// Получить описания для конкретной локации
app.get('/api/locations/:id/descriptions', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`Fetching descriptions for location ID: ${id}`);
    
    const result = await pool.query(
      'SELECT * FROM location_descriptions WHERE location_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    console.log(`Found ${result.rows.length} descriptions for location ${id}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching descriptions:', error);
    console.error('Error details:', error.message);
    
    // Если таблица не существует, возвращаем пустой массив
    if (error.message.includes('relation "location_descriptions" does not exist')) {
      console.log('Table location_descriptions does not exist, returning empty array');
      return res.json([]);
    }
    
    res.status(500).json({ 
      error: 'Ошибка при получении описаний',
      details: error.message 
    });
  }
});

// Добавить описание к локации (только для админа)
app.post('/api/locations/:id/descriptions', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO location_descriptions (location_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [id, title, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating description:', error);
    res.status(500).json({ error: 'Ошибка при создании описания' });
  }
});



// Добавить новую локацию (только для админа)
app.post('/api/locations', authenticateToken, async (req, res) => {
  const { name, longitude, latitude, currentAddress, historicalAddress, author, fiction } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO literature_locations (name, longitude, latitude, current_address, historical_address, author, fiction) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, parseFloat(longitude), parseFloat(latitude), currentAddress, historicalAddress, author, fiction]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Ошибка при создании записи', details: error.message });
  }
});

// Обновить локацию (только для админа)
app.put('/api/locations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, longitude, latitude, currentAddress, historicalAddress, author, fiction } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE literature_locations 
       SET name = $1, longitude = $2, latitude = $3, current_address = $4, 
           historical_address = $5, author = $6, fiction = $7
       WHERE id = $8 RETURNING *`,
      [name, parseFloat(longitude), parseFloat(latitude), currentAddress, historicalAddress, author, fiction, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Ошибка при обновлении записи', details: error.message });
  }
});

// Удалить локацию (только для админа)
app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM literature_locations WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Ошибка при удалении записи' });
  }
});

// Обновить описание (только для админа)
app.put('/api/descriptions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE location_descriptions SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Описание не найдено' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating description:', error);
    res.status(500).json({ error: 'Ошибка при обновлении описания' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});