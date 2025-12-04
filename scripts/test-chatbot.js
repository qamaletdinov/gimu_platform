/**
 * Тестовый скрипт для проверки работы чат-бота
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';
const sessionId = `test_${Date.now()}`;

async function testChatbot() {
  console.log('🧪 Тестирование чат-бота...\n');

  try {
    // 1. Проверка статуса
    console.log('1️⃣ Проверка статуса чат-бота...');
    const statusRes = await axios.get(`${API_URL}/api/chatbot/status`);
    console.log(`   ✅ Статус: ${statusRes.data.isLoaded ? 'Загружен' : 'Не загружен'}`);
    console.log(`   📊 Сообщений: ${statusRes.data.messagesCount}\n`);

    if (!statusRes.data.isLoaded) {
      console.log('❌ Чат-бот не загружен. Запустите:');
      console.log('   npm run load-chatbot example_politician_channel.csv\n');
      return;
    }

    // 2. Тестовые вопросы
    const testQuestions = [
      'Что вы думаете об образовании?',
      'Какая ваша позиция по экономике?',
      'Расскажите о социальной политике',
    ];

    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`${i + 2}️⃣ Вопрос: "${question}"`);

      const response = await axios.post(`${API_URL}/api/chatbot/message`, {
        message: question,
        sessionId: sessionId
      });

      console.log(`   🤖 Ответ: ${response.data.response}\n`);

      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Все тесты пройдены успешно!\n');
    console.log('💡 Теперь откройте приложение в браузере и протестируйте UI:');
    console.log('   1. npm run dev');
    console.log('   2. Откройте http://localhost:5173');
    console.log('   3. Нажмите на кнопку чата в правом нижнем углу 💬');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:');
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Ошибка: ${error.response.data.error || error.message}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Сервер не запущен!');
      console.error('   Запустите: npm run server');
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

testChatbot();

