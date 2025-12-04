/**
 * Скрипт для загрузки данных Telegram канала в чат-бот
 * Использование: node scripts/load-chatbot-data.js <имя_файла.csv>
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001';

async function loadChatbotData(csvFileName) {
  console.log('🤖 Загрузка данных в чат-бот...');
  console.log(`📁 Файл: ${csvFileName}`);

  // Проверяем существование файла
  const csvPath = path.join(__dirname, '../server/storage', csvFileName);
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Файл не найден: ${csvPath}`);
    console.log('\n💡 Убедитесь, что CSV файл находится в папке server/storage/');
    process.exit(1);
  }

  try {
    const response = await axios.post(`${API_URL}/api/chatbot/load-data`, {
      csvFileName: csvFileName
    });

    console.log('✅ Данные успешно загружены!');
    console.log(`📊 Загружено сообщений: ${response.data.messagesLoaded}`);
    console.log(`💬 ${response.data.message}`);

    // Проверяем статус
    const statusResponse = await axios.get(`${API_URL}/api/chatbot/status`);
    console.log('\n📈 Статус чат-бота:');
    console.log(`   Загружен: ${statusResponse.data.isLoaded ? 'Да ✓' : 'Нет ✗'}`);
    console.log(`   Сообщений в памяти: ${statusResponse.data.messagesCount}`);

  } catch (error) {
    console.error('❌ Ошибка при загрузке данных:');
    if (error.response) {
      console.error(`   ${error.response.data.error}`);
      if (error.response.data.details) {
        console.error(`   Детали: ${error.response.data.details}`);
      }
    } else {
      console.error(`   ${error.message}`);
    }

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Убедитесь, что сервер запущен на порту 3001');
      console.log('   Запустите: npm run server');
    }

    process.exit(1);
  }
}

// Получаем имя файла из аргументов командной строки
const csvFileName = process.argv[2];

if (!csvFileName) {
  console.error('❌ Не указано имя CSV файла');
  console.log('\nИспользование:');
  console.log('  node scripts/load-chatbot-data.js <имя_файла.csv>');
  console.log('\nПример:');
  console.log('  node scripts/load-chatbot-data.js telegram_channel.csv');
  console.log('\n💡 Поместите CSV файл в папку server/storage/');
  process.exit(1);
}

loadChatbotData(csvFileName);

