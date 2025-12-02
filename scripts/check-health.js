// Скрипт проверки работоспособности проекта
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка работоспособности GIMU Platform...\n');

// Проверка обязательных файлов
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  '.env',
  'src/main.js',
  'src/App.vue',
  'server/server.js',
  'server/aiAgent.js',
  'server/db/index.js',
  'server/db/init.sql',
];

let allFilesExist = true;

console.log('📁 Проверка файлов:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n');

// Проверка переменных окружения
console.log('🔐 Проверка переменных окружения:');
require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET', 'GEMINI_API_KEY'];
let allEnvVarsSet = true;

requiredEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${envVar}`);
  if (!exists) allEnvVarsSet = false;
});

console.log('\n');

// Проверка node_modules
console.log('📦 Проверка зависимостей:');
const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
console.log(`${nodeModulesExists ? '✅' : '❌'} node_modules`);

console.log('\n');

// Проверка базы данных
console.log('💾 Проверка базы данных:');
const dbExists = fs.existsSync(path.join(__dirname, '..', 'gimu.db'));
console.log(`${dbExists ? '✅' : '⚠️'} gimu.db ${!dbExists ? '(будет создана при первом запуске)' : ''}`);

console.log('\n');

// Итоговый результат
console.log('📊 Результат проверки:');
if (allFilesExist && allEnvVarsSet && nodeModulesExists) {
  console.log('✅ Проект готов к запуску!');
  console.log('\n🚀 Для запуска выполните:');
  console.log('   Frontend: npm run dev');
  console.log('   Backend:  npm run server');
  process.exit(0);
} else {
  console.log('❌ Обнаружены проблемы:');
  if (!allFilesExist) console.log('   - Отсутствуют обязательные файлы');
  if (!allEnvVarsSet) console.log('   - Не настроены переменные окружения в .env');
  if (!nodeModulesExists) console.log('   - Необходимо выполнить: npm install --legacy-peer-deps');
  process.exit(1);
}

