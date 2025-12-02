import sqlite3 from 'sqlite3';
import readline from 'readline';

const db = new sqlite3.Database('./gimu.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the email of the user to make admin: ', (email) => {
  if (!email) {
    console.log('Email cannot be empty.');
    rl.close();
    return;
  }

  const sql = `UPDATE users SET role = 'admin' WHERE email = ?`;

  db.run(sql, [email], function(err) {
    if (err) {
      return console.error(err.message);
    }
    if (this.changes === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      console.log(`User with email ${email} has been granted admin role.`);
    }
  });

  rl.close();
  db.close();
});
