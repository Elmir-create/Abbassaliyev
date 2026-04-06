const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Подключение к БД SQLite (файл создастся автоматически)
const db = new sqlite3.Database('./travel.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

// Создаём таблицы и заполняем данными
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price_per_day REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accommodation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        coefficient REAL NOT NULL
    )`);

    // Вставляем начальные данные, если таблицы пусты
    db.get("SELECT COUNT(*) as count FROM countries", (err, row) => {
        if (row.count === 0) {
            const countries = [
                ['Турция', 5000],
                ['Египет', 4500],
                ['Таиланд', 6000],
                ['Италия', 8000],
                ['Китай', 3500]
            ];
            const stmt = db.prepare("INSERT INTO countries (name, price_per_day) VALUES (?, ?)");
            countries.forEach(c => stmt.run(c[0], c[1]));
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM accommodation", (err, row) => {
        if (row.count === 0) {
            const types = [
                ['Эконом', 0.8],
                ['Стандарт', 1.0],
                ['Люкс', 1.5]
            ];
            const stmt = db.prepare("INSERT INTO accommodation (type, coefficient) VALUES (?, ?)");
            types.forEach(t => stmt.run(t[0], t[1]));
            stmt.finalize();
        }
    });
});

// API: получить список стран
app.get('/api/countries', (req, res) => {
    db.all("SELECT id, name, price_per_day FROM countries", (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true, countries: rows });
        }
    });
});

// API: получить типы проживания
app.get('/api/accommodation', (req, res) => {
    db.all("SELECT id, type, coefficient FROM accommodation", (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true, accommodation: rows });
        }
    });
});

// API: расчёт стоимости
app.post('/api/calculate', (req, res) => {
    const { country_id, days, persons, accommodation_id } = req.body;

    if (!country_id || !days || !persons || !accommodation_id) {
        return res.status(400).json({ success: false, error: 'Не все параметры указаны' });
    }

    db.get("SELECT price_per_day FROM countries WHERE id = ?", [country_id], (err, country) => {
        if (err || !country) {
            return res.status(400).json({ success: false, error: 'Страна не найдена' });
        }
        db.get("SELECT coefficient FROM accommodation WHERE id = ?", [accommodation_id], (err, acc) => {
            if (err || !acc) {
                return res.status(400).json({ success: false, error: 'Тип проживания не найден' });
            }
            const total = country.price_per_day * days * persons * acc.coefficient;
            res.json({
                success: true,
                total: total,
                calculation: `${country.price_per_day} * ${days} * ${persons} * ${acc.coefficient} = ${total}`
            });
        });
    });
});

// Отдаём статическую страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});