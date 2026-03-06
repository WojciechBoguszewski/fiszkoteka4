const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 2137);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fiszki',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testDbConnection() {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        console.log('Połączono z bazą danych.');
    } catch (err) {
        console.error('Błąd połączenia z bazą danych:', err);
    }
}

testDbConnection();


app.get('/', (req, res) => {
    res.send('FiszkoTekka API działa!');
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Brak loginu lub hasła' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, name FROM users WHERE name = ? AND password = ? LIMIT 1',
            [username, password]
        );

        if (!rows.length) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        }

        return res.json({ user: { id: rows[0].id, name: rows[0].name } });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Brak loginu lub hasła' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE name = ? LIMIT 1',
            [username]
        );

        if (existing.length) {
            return res.status(409).json({ error: 'Użytkownik już istnieje' });
        }

        const [result] = await pool.query(
            'INSERT INTO users (name, password) VALUES (?, ?)',
            [username, password]
        );

        return res.status(201).json({
            message: 'Użytkownik zarejestrowany',
            user: { id: result.insertId, name: username }
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.get('/api/data/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'Nieprawidłowe userId' });
    }

    try {
        const [rows] = await pool.query(
            `
            SELECT 
                s.id AS setId,
                s.name AS setName,
                c.id AS cardId,
                c.sideA AS sideA,
                c.sideB AS sideB
            FROM sets s
            LEFT JOIN cards c ON c.setId = s.id
            WHERE s.userId = ?
            ORDER BY s.id DESC, c.id ASC
            `,
            [userId]
        );

        const setsMap = new Map();
        for (const row of rows) {
            if (!setsMap.has(row.setId)) {
                setsMap.set(row.setId, {
                    id: row.setId,
                    title: row.setName,
                    cards: []
                });
            }

            if (row.cardId) {
                setsMap.get(row.setId).cards.push({
                    id: row.cardId,
                    word: row.sideA || '',
                    def: row.sideB || ''
                });
            }
        }

        return res.json(Array.from(setsMap.values()));
    } catch (err) {
        console.error('Get data error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.post('/api/sets', async (req, res) => {
    const { userId, title } = req.body || {};
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || !title || !title.trim()) {
        return res.status(400).json({ error: 'Nieprawidłowe dane' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO sets (name, userId) VALUES (?, ?)',
            [title.trim(), parsedUserId]
        );

        return res.status(201).json({
            id: result.insertId,
            title: title.trim(),
            cards: []
        });
    } catch (err) {
        console.error('Create set error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.delete('/api/sets/:id', async (req, res) => {
    const setId = Number(req.params.id);
    if (!Number.isInteger(setId)) {
        return res.status(400).json({ error: 'Nieprawidłowe id zestawu' });
    }

    try {
        await pool.query('DELETE FROM sets WHERE id = ?', [setId]);
        return res.json({ message: 'Zestaw usunięty' });
    } catch (err) {
        console.error('Delete set error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.put('/api/sets/:id', async (req, res) => {
    const setId = Number(req.params.id);
    const { title, cards } = req.body || {};

    if (!Number.isInteger(setId) || !title || !title.trim()) {
        return res.status(400).json({ error: 'Nieprawidłowe dane' });
    }

    try {
        await pool.query('UPDATE sets SET name = ? WHERE id = ?', [title.trim(), setId]);
        await pool.query('DELETE FROM cards WHERE setId = ?', [setId]);

        if (Array.isArray(cards) && cards.length > 0) {
            const values = cards.map(card => [
                card.word ? String(card.word) : '',
                card.def ? String(card.def) : '',
                setId
            ]);

            await pool.query(
                'INSERT INTO cards (sideA, sideB, setId) VALUES ?',
                [values]
            );
        }

        return res.json({ message: 'Zestaw zapisany' });
    } catch (err) {
        console.error('Update set error:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
});

app.listen(port, () => {
    console.log(`Serwer Express uruchomiony na http://localhost:${port}`);
});
