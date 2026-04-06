const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./travel.db');

db.serialize(() => {
    
    db.run("INSERT INTO countries (name, price_per_day) VALUES ('Китай', 5500)");

    db.run("INSERT INTO countries (name, price_per_day) VALUES ('Япония', 7000)");

    db.run("INSERT INTO accommodation (type, coefficient) VALUES ('Бизнес +', 2.5)");
    console.log('✅ Данные добавлены');
});

db.close();