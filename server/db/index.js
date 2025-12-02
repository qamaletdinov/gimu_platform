const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbFilePath = './gimu.db';
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Database connection established.");

    // Оптимизация SQLite для лучшей производительности
    db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging для лучшей concurrency
    db.run('PRAGMA synchronous = NORMAL'); // Баланс между безопасностью и скоростью
    db.run('PRAGMA cache_size = -64000'); // 64MB cache
    db.run('PRAGMA temp_store = MEMORY'); // Хранить временные данные в памяти
    db.run('PRAGMA mmap_size = 30000000000'); // Memory-mapped I/O
    db.run('PRAGMA page_size = 4096'); // Оптимальный размер страницы
  }
});

const initDb = () => {
  const schema = fs.readFileSync(path.resolve(process.cwd(), 'server/db/init.sql'), 'utf8');
  db.exec(schema, (err) => {
    if (err) {
      console.error("Error initializing database:", err.message);
    } else {
      console.log("Database initialized successfully.");
    }
  });
};

if (!fs.existsSync(dbFilePath)) {
  console.log("Database file not found, creating and initializing...");
  initDb();
}

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const preparedSql = sql.replace(/\$\d+/g, '?');
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(preparedSql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    } else {
      db.run(preparedSql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
        }
      });
    }
  });
};

module.exports = { query };
