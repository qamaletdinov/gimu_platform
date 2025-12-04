/**
 * Детальный debug тест для RAG чат-бота
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function debugTest() {
  console.log('🔍 Детальный debug тест RAG чат-бота\n');

  try {
    // 1. Проверка статуса
    console.log('1️⃣ Проверка статуса...');
    const statusRes = await axios.get(`${API_URL}/api/chatbot/status`);
    console.log(`   ✅ Загружен: ${statusRes.data.isLoaded}`);
    console.log(`   📊 Сообщений: ${statusRes.data.messagesCount}\n`);

    if (!statusRes.data.isLoaded) {
      console.log('❌ Чат-бот не загружен!\n');
      return;
    }

    // 2. Тестовый вопрос с детальными логами
    const question = 'Что вы думаете об экономике?';
    console.log(`2️⃣ Отправка вопроса: "${question}"`);
    console.log('   📤 Отправляю запрос...\n');

    const response = await axios.post(`${API_URL}/api/chatbot/message`, {
      message: question,
      sessionId: `debug_${Date.now()}`
    }, {
      timeout: 60000 // 60 секунд таймаут
    });

    console.log('\n✅ Ответ получен:');
    console.log(`   ${response.data.response}\n`);

    console.log('💡 Проверьте логи сервера для детальной информации о RAG!');
    console.log('   Вы должны увидеть:');
    console.log('   - 🔍 RAG Debug для вопроса');
    console.log('   - 📊 Найдено релевантных сообщений');
    console.log('   - 📝 Релевантные сообщения');
    console.log('   - ✅ Ответ получен\n');

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:');
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Сервер не запущен!');
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

debugTest();

